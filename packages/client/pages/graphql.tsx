import dynamic from "next/dynamic";
const GraphiQLApp = dynamic(() => import("../components/graphiql"), {
  ssr: false,
});

const Main = ({ serverURL }) => {
  return <GraphiQLApp url={serverURL} />;
};

export default Main;

Main.getInitialProps = (ctx) => {
  const config = JSON.parse(ctx.req.headers["Forestry-Config"]);

  return { serverURL: config.serverURL };
};
