import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getSecure } from "../helpers/secureStore";

const httpLink = createHttpLink({
  uri: "https://strings.gregx.site/",
});

const authLink = setContext(async (_, { headers }) => {
  const access_token = await getSecure("access_token");
  const userId = await getSecure("userId");
  return {
    headers: {
      ...headers,
      authorization: access_token ? `Bearer ${access_token}` : "",
      userId: userId ? `${userId}` : "",
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
