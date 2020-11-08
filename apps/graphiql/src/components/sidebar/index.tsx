import React from "react";
import { Link, useParams } from "react-router-dom";
import { useToggleMachine } from "../../hooks/useToggle";
import { useCMS } from "tinacms";

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

export const Sidebar = ({
  projects,
  onFileSelect,
}: {
  projects: Project[];
  items?: Item[];
  onFileSelect: (args: { relativePath: string; section: string }) => void;
}) => {
  const { project } = useParams();

  const [sections, setSections] = React.useState<
    {
      slug: string;
      documents: { relativePath: string; breadcrumbs: string[] }[];
    }[]
  >([]);

  const [activeDocument, setActiveDocument] = React.useState<{
    relativePath: string;
    section: string;
  } | null>(null);

  React.useEffect(() => {
    if (activeDocument) {
      onFileSelect(activeDocument);
    }
  }, [activeDocument]);

  React.useEffect(() => {
    if (sections.length > 0) {
      setActiveDocument({
        relativePath: sections[0].documents[0].relativePath,
        section: sections[0].slug,
      });
    }
  }, [sections]);

  const cms = useCMS();

  React.useEffect(() => {
    const listSections = async () => {
      try {
        const result2 = await cms.api.forestry.listSections();
        setSections(result2);
      } catch (e) {
        console.log("unable to list documents...");
        console.log(e);
      }
    };
    listSections();
  }, [project]);

  const [, modalSend, modalClassNames] = useToggleMachine({
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
        className: "opacity-100 translate-y-0 sm:scale-100",
      },
      closed: {
        className: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95",
      },
    },
  });

  const [, sendRealm, classNamesRealm] = useToggleMachine({
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
      {/* @ts-ignore */}
      <ConfigModal classNames={modalClassNames} />
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
                  <div className="flex-1 text-left">
                    <p className="text-gray-200 text-sm leading-5 truncate">
                      Project:
                    </p>
                    <h2 className="text-gray-100 text-lg capitalize leading-5 font-medium">
                      {project}
                    </h2>
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
                                <h2 className="text-gray-900 text-sm leading-5 font-medium text-left">
                                  {project.label}
                                </h2>
                                <p className="text-gray-500 text-sm leading-5 truncate text-left">
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
                <div className="py-1">
                  <button
                    onClick={() => {
                      sendRealm("CLOSE");
                      modalSend("OPEN");
                    }}
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
                          <h2 className="text-gray-900 text-sm leading-5 font-medium text-left">
                            Config
                          </h2>
                          <p className="text-gray-500 text-sm leading-5 truncate text-left">
                            Add config
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="h-0 flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 bg-gray-800 pt-2">
              <div>
                {sections.map((section) => {
                  return (
                    <>
                      <button
                        onClick={() => {
                          activeDocument?.section === section.slug
                            ? setActiveDocument(null)
                            : setActiveDocument({
                                relativePath: "",
                                section: section.slug,
                              });
                        }}
                        className={`mt-1 group w-full flex items-center pr-2 py-2 text-sm leading-5 font-medium rounded-md text-gray-100 hover:bg-gray-600 hover:text-gray-200 focus:outline-none focus:text-gray-200 focus:bg-gray-600 transition ease-in-out duration-150 ${
                          activeDocument?.section === section.slug
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
                        {section.slug}
                      </button>
                      <div
                        className={`mt-1 space-y-1 ${
                          activeDocument?.section === section.slug
                            ? ""
                            : "hidden"
                        }`}
                      >
                        {section.documents.map((document) => {
                          return (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveDocument({
                                  relativePath: document.relativePath,
                                  section: section.slug,
                                })
                              }
                              className="group w-full flex items-center pl-10 pr-2 py-2 text-sm leading-5 font-medium text-gray-100 rounded-md hover:text-gray-200 hover:bg-gray-600 focus:outline-none focus:text-gray-200 focus:bg-gray-600 transition ease-in-out duration-150"
                            >
                              {document.breadcrumbs.join("/")}
                            </button>
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

export const ConfigModal = ({
  classNames,
}: {
  classNames: {
    outerClasses: string;
    overlayClasses: string;
    menuClasses: string;
  };
}) => {
  const serverURLRef = React.createRef<HTMLInputElement>();
  const clientIDRef = React.createRef<HTMLInputElement>();
  return (
    <div
      className={`fixed z-10 inset-0 overflow-y-auto ${classNames.outerClasses}`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (serverURLRef.current && clientIDRef.current) {
            // @ts-ignore
            window.location = `external/${encodeURIComponent(
              serverURLRef.current.value
            )}/${clientIDRef.current.value}`;
          }
        }}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className={`fixed inset-0 transition-opacity ${classNames.overlayClasses}`}
          >
            <div className="absolute inset-0 bg-gray-500 opacity-75" />
          </div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" />
          ​
          <div
            className={`inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6 ${classNames.menuClasses}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-headline"
          >
            <div className="mx-auto flex items-center justify-center text-lg font-bold mb-4">
              Provide a URL and optional Client ID
            </div>
            <div>
              <label
                htmlFor="serverURL"
                className="block text-sm font-medium leading-5 text-gray-700"
              >
                Server URL
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  ref={serverURLRef}
                  id="serverURL"
                  className="form-input block w-full sm:text-sm sm:leading-5"
                  placeholder="http://localhost:4002/graphql"
                />
              </div>
              <div>
                <label
                  htmlFor="clientID"
                  className="block text-sm font-medium leading-5 text-gray-700 mt-4"
                >
                  Client ID
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    ref={clientIDRef}
                    id="clientID"
                    className="form-input block w-full sm:text-sm sm:leading-5"
                    placeholder="abc-123"
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <span className="flex w-full rounded-md shadow-sm">
                <button
                  type="submit"
                  className="inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 bg-indigo-600 text-base leading-6 font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                >
                  Go to playground
                </button>
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
