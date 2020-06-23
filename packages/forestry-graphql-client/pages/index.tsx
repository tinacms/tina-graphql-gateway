import dynamic from "next/dynamic";
const GraphiQLApp = dynamic(() => import("../components/graphiql"), {
  ssr: false,
});

const Main = () => {
  return <GraphiQLApp />;
};

export default Main;
