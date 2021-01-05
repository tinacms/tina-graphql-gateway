import { Sidebar } from "../components/sidebar";

const Main = (props) => {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar relativePath="" />
    </div>
  );
};

export default Main;
