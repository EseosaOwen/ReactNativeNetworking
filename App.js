import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  QueryClientProvider,
  QueryClient,
  useInfiniteQuery,
  useMutation,
} from "react-query";
import axios from "axios";
import styled from "styled-components";
import { useState } from "react";

function NetworkingDemo() {
  // TODO Here we want to display 10 posts first, then if the user refreshes another 10 posts, and so on.
  // ! State variables
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  async function retrievePosts({ pageParam = 1 }) {
    // NB Here, we need to make sure we are fetching a limit of 10 and the pageParam will be based on the getNextPageParam of the useInfiniteQueries.
    try {
      const response = await axios.get(
        `https://jsonplaceholder.typicode.com/posts?_limit=10&_page=${pageParam}`
      );
      return response.data;
    } catch (ex) {
      console.log(ex);
    }
  }

  async function addPosts(fieldsData) {
    try {
      const response = await axios.post(
        "https://jsonplaceholder.typicode.com/posts",
        fieldsData
      );
      return response.data;
    } catch (ex) {
      console.log(ex);
    }
  }

  // * So first we need to use useInfiniteQuery, this will allow us to have access to some other configuration methods and properties, such as fetchNext page.
  const { data, isLoading, hasNextPage, fetchNextPage, isFetching } =
    useInfiniteQuery("posts", retrievePosts, {
      // * This function is called whenever the fetchNextPage prop function is called on click of a button or in this case, the reloading of a page using the FlatList
      // NB This function takes 2 parameters. The lastPage and the pages (number of current pages)
      getNextPageParam: (_lastPage, pages) => {
        // ! So we check if the pages.length is greater than 10, because we have a data of 100 posts and we want to have 10 posts per page. In essence, 10 pages in total.
        if (pages.length < 10) {
          // * if so we return a new page, by adding 1 to the current number of pages.
          return pages.length + 1;
        } else return undefined; // NB else if the pages.length is the same as 10, it means we are at the last page, and so return undefined.
      },
    });

  const { mutate: addPostMutate } = useMutation(addPosts, {
    onSuccess: () => Alert.alert("Post added"),
  });

  function validateForm() {
    let error = "";
    if (!title || !body) error = "Title and Body must be filled";
    setError(error);

    // ! returns true if no error
    return !error;
  }

  function handleSubmit() {
    if (validateForm()) {
      addPostMutate({
        title,
        body,
      });
      setTitle("");
      setBody("");
      setError("");
    }
  }

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingIndicator size="large" color="midnightblue" />
        <Text style={{ marginTop: 5 }}>Loading...</Text>
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <AddPostContainer>
        <AddPostHeader>Add Post</AddPostHeader>
        <InputField placeholder="Title" value={title} onChangeText={setTitle} />
        <InputField
          placeholder="Body"
          value={body}
          onChangeText={setBody}
          multiline
          style={{ height: 70, textAlignVertical: "top" }}
        />
        <PostButton onPress={handleSubmit}>
          <Text style={{ fontSize: 17, textAlign: "center" }}>Post</Text>
        </PostButton>
      </AddPostContainer>
      <ListContainer>
        <FlatList
          // ? So now, when it comes to InfiniteQueries the data is an object that contains pages, pages is an array that contains a page, and each page is an array that contains posts.
          // * So first we need to pass down the pages to the data prop
          // * With the way FlatList is built, it loops through the data prop for us and would give us a single page, which is an array.
          data={data.pages}
          renderItem={({ item: page, index }) => {
            // NB So the next thing, we need to do is loop through that array, so basically the renderItem will return just a page, then we loop through the page inside the renderItem and display each posts for that page.
            return (
              // ! To make sure that the last page is the one with the extra space at the bottom, we need to find out what page we are on and then compare it with the length of the page.
              <View
                style={{
                  [index + 1 === data.pages.length && "marginBottom"]: 15,
                }}
              >
                {page &&
                  page.map((post) => (
                    <Post
                      key={post.id}
                      style={{
                        marginBottom: 15,
                      }}
                    >
                      <TitleText style={{ fontWeight: "bold", fontSize: 18 }}>
                        {post.title}
                      </TitleText>
                      <BodyText>{post.body}</BodyText>
                    </Post>
                  ))}
              </View>
            );
          }}
          style={{ padding: 10 }}
          ListHeaderComponent={() => <ListHeader>JSON LIST</ListHeader>}
          ListEmptyComponent={() => <NoItemsFound>No Posts found</NoItemsFound>}
          ItemSeparatorComponent={() => <View style={{ height: 5 }}></View>}
          refreshing={isFetching}
          onRefresh={fetchNextPage}
        />
      </ListContainer>
    </Container>
  );
}

export default function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NetworkingDemo />
    </QueryClientProvider>
  );
}

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: #f5f5f5f5;
  padding-top: ${StatusBar.currentHeight}px; // ! android
`;

const AddPostContainer = styled(View)`
  padding: 0 16px;
  margin-top: 20px;
  margin-bottom: 20px;
`;

const AddPostHeader = styled(Text)`
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 16px;
  text-align: center;
`;

const InputField = styled(TextInput)`
  border: solid 1px black;
  border-radius: 6px;
  padding: 5px;
  height: 40px;
  margin-bottom: 16px;
`;

const PostButton = styled(Pressable)`
  width: 100%;
  background-color: #b2a3f1;
  padding: 10px;
  border-radius: 6px;
`;

const LoadingIndicator = styled(ActivityIndicator)`
  align-self: center;
`;

const LoadingContainer = styled(SafeAreaView)`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5f5;
  padding-top: ${StatusBar.currentHeight}px;
`;

const ListContainer = styled(View)`
  flex: 1;
  padding: 0 10px;
`;

const NoItemsFound = styled(Text)`
  align-self: center;
`;

const ListHeader = styled(Text)`
  font-weight: bold;
  text-align: center;
  font-size: 20px;
  margin-bottom: 16px;
`;

const Post = styled(View)`
  padding: 16px;
  width: 100%;
  background-color: #b2a3f1;
  border-radius: 7px;
`;

const TitleText = styled(Text)`
  font-weight: bold;
  font-size: 22px;
  margin-bottom: 16px;
`;

const BodyText = styled(Text)`
  font-size: 17px;
  color: #666666;
`;
