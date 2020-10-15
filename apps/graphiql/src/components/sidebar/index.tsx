import React from "react";
import { Link, useParams } from "react-router-dom";
import { useToggleMachine } from "../../hooks/useToggle";

type Icon = "home" | "team" | "folder" | "calendar" | "chart" | "lock-closed";
type Item = {
  icon: Icon;
  label: string;
  link: string;
};
type Project = {
  label: string;
  value: string;
};

const defaultItems = [
  { icon: "chart" as const, label: "Apps", link: "/apps" },
  { icon: "lock-closed" as const, label: "Providers", link: "/providers" },
];

export const Sidebar = ({
  projects,
  items = defaultItems,
  onFileSelect,
}: {
  projects: Project[];
  items?: Item[];
  onFileSelect: (path: string) => void;
}) => {
  let { project } = useParams();

  const [documents, setDocuments] = React.useState<
    { name: string; files: string[] }[]
  >([]);

  const [activeDocument, setActiveDocument] = React.useState({
    folder: "posts",
    file: "",
  });

  React.useEffect(() => {
    const listDocuments = async () => {
      const result = await fetch(
        `http://localhost:4000/list-documents/${project}`
      );
      const json = await result.json();
      setDocuments(json);
    };
    listDocuments();
  }, []);

  const [_, send, classNames] = useToggleMachine({
    outerClasses: {
      closed: { className: "pointer-events-none" },
    },
    overlayClasses: {
      className: "transition-opacity ease-linear duration-300",
      opened: {
        className: "opacity-100",
      },
      closed: {
        className: "opacity-0 pointer-events-none",
      },
    },
    closeButton: {
      opened: {
        className: "block",
      },
      closed: {
        className: "hidden",
      },
    },

    menuClasses: {
      className: "transition ease-in-out duration-300 transform",
      opened: {
        className: "translate-x-0",
      },
      closed: {
        className: "-translate-x-full",
      },
    },
  });
  const [_realmState, sendRealm, classNamesRealm] = useToggleMachine({
    realmDropdown: {
      className:
        "z-10 mx-3 origin-bottom absolute right-0 left-0 mt-1 rounded-md shadow-lg top-full",
      opened: {
        className: "pointer-events-auto transform opacity-100 scale-100",
      },
      closed: {
        className: "pointer-events-none transform opacity-0 scale-95",
      },
    },
  });

  return (
    <>
      {/* Off-canvas menu for mobile */}
      <div className="md:hidden">
        <div className={`fixed inset-0 flex z-40 ${classNames.outerClasses}`}>
          <div className={`fixed inset-0 ${classNames.overlayClasses}`}>
            <div className="absolute inset-0 bg-gray-600 opacity-75" />
          </div>
          <div
            className={`relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-gray-800 ${classNames.menuClasses}`}
          >
            <div className="absolute top-0 right-0 -mr-14 p-1">
              <button
                onClick={() => send("TOGGLE")}
                className={`flex items-center justify-center h-12 w-12 rounded-full focus:outline-none focus:bg-gray-600 ${classNames.closeButton}`}
                aria-label="Close sidebar"
              >
                <svg
                  className="h-6 w-6 text-white"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-shrink-0 flex items-center px-4">
              <button
                type="button"
                className="group w-full rounded-md px-3.5 py-2 text-sm leading-5 font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-500 focus:outline-none focus:bg-gray-200 focus:border-blue-300 active:bg-gray-50 active:text-gray-800 transition ease-in-out duration-150"
                id="options-menu"
                aria-haspopup="true"
                aria-expanded="true"
              >
                <div className="flex w-full justify-between items-center">
                  <div className="flex items-center justify-between space-x-3">
                    <img
                      className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"
                      src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=256&h=256&q=80"
                      alt=""
                    />
                    <div className="flex-1">
                      <h2 className="text-gray-900 text-sm leading-5 font-medium">
                        Jessy Schwarz
                      </h2>
                      <p className="text-gray-500 text-sm leading-5 truncate">
                        @jessyschwarz
                      </p>
                    </div>
                  </div>
                  <svg
                    className="h-5 w-5 text-gray-400 group-hover:text-gray-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </button>
            </div>
            <div className="mt-5 flex-1 h-0 overflow-y-auto">
              <nav className="px-2">
                {items.map((item) => (
                  <NavItem key={item.link} active={false} {...item} />
                ))}
              </nav>
            </div>
          </div>
          <div className="flex-shrink-0 w-14">
            {/* Dummy element to force sidebar to shrink to fit close icon */}
          </div>
        </div>
      </div>
      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col" style={{ width: "21rem" }}>
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900 relative">
            <button
              type="button"
              onClick={() => sendRealm("TOGGLE")}
              className="group w-full rounded-md px-3.5 py-2 text-sm leading-5 font-medium text-gray-700 hover:bg-navy-700 hover:text-gray-200 focus:outline-none focus:bg-gray-200 focus:border-blue-300 active:bg-navy-600 active:text-gray-200 transition ease-in-out duration-150"
              id="options-menu"
              aria-haspopup="true"
              aria-expanded="true"
            >
              <div className="flex w-full justify-between items-center">
                <div className="flex items-center justify-between space-x-3">
                  <img
                    className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"
                    src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=256&h=256&q=80"
                    alt=""
                  />
                  <div className="flex-1">
                    <h2 className="text-gray-100 text-sm leading-5 font-medium">
                      Realm Name
                    </h2>
                    <p className="text-gray-200 text-sm leading-5 truncate">
                      @realm-slug
                    </p>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-gray-400 group-hover:text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </button>
            <div className={classNamesRealm.realmDropdown}>
              <div className="rounded-md bg-white shadow-xs">
                {projects.map((project) => {
                  return (
                    <Link to={`/${project.value}`}>
                      <div className="py-1">
                        <button
                          onClick={() => sendRealm("CLOSE")}
                          type="button"
                          className="group w-full rounded-md px-3.5 py-2 text-sm leading-5 font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-500 focus:outline-none focus:bg-gray-200 focus:border-blue-300 active:bg-gray-50 active:text-gray-800 transition ease-in-out duration-150"
                          id="options-menu"
                          aria-haspopup="true"
                          aria-expanded="true"
                        >
                          <div className="flex w-full justify-between items-center">
                            <div className="flex items-center justify-between space-x-3">
                              <img
                                className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"
                                src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=256&h=256&q=80"
                                alt=""
                              />
                              <div className="flex-1">
                                <h2 className="text-gray-900 text-sm leading-5 font-medium">
                                  {project.label}
                                </h2>
                                <p className="text-gray-500 text-sm leading-5 truncate">
                                  {project.value}
                                </p>
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="h-0 flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 bg-gray-800 pt-2">
              <div>
                {documents.map((documentFolder) => {
                  return (
                    <>
                      <button
                        onClick={() =>
                          setActiveDocument({
                            folder:
                              activeDocument.folder === documentFolder.name
                                ? ""
                                : documentFolder.name,
                            file: activeDocument.file,
                          })
                        }
                        className={`mt-1 group w-full flex items-center pr-2 py-2 text-sm leading-5 font-medium rounded-md text-gray-100 hover:bg-gray-600 hover:text-gray-200 focus:outline-none focus:text-gray-200 focus:bg-gray-600 transition ease-in-out duration-150 ${
                          activeDocument.folder === documentFolder.name
                            ? "bg-gray-600"
                            : ""
                        }`}
                      >
                        {/* Expanded: "text-gray-200 rotate-90", Collapsed: "text-gray-300" */}
                        <svg
                          className="mr-2 h-5 w-5 transform group-hover:text-gray-200 group-focus:text-gray-200 transition-colors ease-in-out duration-150"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6 6L14 10L6 14V6Z" fill="currentColor" />
                        </svg>
                        {documentFolder.name}
                      </button>
                      <div
                        className={`mt-1 space-y-1 ${
                          activeDocument.folder === documentFolder.name
                            ? ""
                            : "hidden"
                        }`}
                      >
                        {documentFolder.files.map((file) => {
                          return (
                            <a
                              href="#"
                              onClick={() =>
                                onFileSelect(`${documentFolder.name}/${file}`)
                              }
                              className="group w-full flex items-center pl-10 pr-2 py-2 text-sm leading-5 font-medium text-gray-100 rounded-md hover:text-gray-200 hover:bg-gray-600 focus:outline-none focus:text-gray-200 focus:bg-gray-600 transition ease-in-out duration-150"
                            >
                              {file}
                            </a>
                          );
                        })}
                      </div>
                    </>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

type NavItemType = Item & {
  active: boolean;
};

const NavItem = ({ active, label, link, icon }: NavItemType) => {
  const activeClass =
    "group flex items-center px-2 py-2 text-sm leading-5 font-medium text-white rounded-md bg-gray-900 focus:outline-none focus:bg-gray-700 transition ease-in-out duration-150";
  const inactiveClass =
    "mt-1 group flex items-center px-2 py-2 text-sm leading-5 font-medium text-gray-300 rounded-md hover:text-white hover:bg-gray-700 focus:outline-none focus:text-white focus:bg-gray-700 transition ease-in-out duration-150";
  return (
    <Link to={link} className={active ? activeClass : inactiveClass}>
      <Icon glyph={icon} />
      {label}
    </Link>
  );
};

const Icon = ({ glyph }: { glyph: Icon }) => {
  switch (glyph) {
    case "calendar":
      return (
        <svg
          className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300 group-focus:text-gray-300 transition ease-in-out duration-150"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    case "home":
      return (
        <svg
          className="mr-3 h-6 w-6 text-gray-300 group-hover:text-gray-300 group-focus:text-gray-300 transition ease-in-out duration-150"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      );
    case "team":
      return (
        <svg
          className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300 group-focus:text-gray-300 transition ease-in-out duration-150"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      );
    case "folder":
      return (
        <svg
          className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300 group-focus:text-gray-300 transition ease-in-out duration-150"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      );
    case "chart":
      return (
        <svg
          className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300 group-focus:text-gray-300 transition ease-in-out duration-150"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      );
    case "lock-closed":
      return (
        <svg
          className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300 group-focus:text-gray-300 transition ease-in-out duration-150"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z"
          />
        </svg>
      );
  }
};
