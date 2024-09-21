// app/root.tsx
import { json, LoaderArgs } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { ChakraProvider } from "@chakra-ui/react";
import { getUser } from "~/utils/auth.server";
import Layout from "~/components/Layout";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request);
  return json({ user });
};

export default function App() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ChakraProvider>
          <Layout user={user}>
            <Outlet />
          </Layout>
        </ChakraProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}