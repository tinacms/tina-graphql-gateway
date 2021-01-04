import React from "react";
import Link from "next/link";
import { useCMS } from "tinacms";

export const Sidebar = ({ relativePath }: { relativePath: string }) => {
  const [sections, setSections] = React.useState<
    {
      slug: string;
      path: string;
      documents?: { sys: { relativePath: string; breadcrumbs: string[] } }[];
    }[]
  >([]);

  const [activeSections, setActiveSections] = React.useState<string[]>([]);

  const cms = useCMS();

  React.useEffect(() => {
    const listSections = async () => {
      try {
        const result = await cms.api.forestry.request(
          (gql) => gql`
            query {
              getSections {
                path
                slug
                label
                documents {
                  sys {
                    filename
                    basename
                    relativePath
                    breadcrumbs(excludeExtension: true)
                    section {
                      type
                      path
                      slug
                    }
                  }
                }
              }
            }
          `,
          {}
        );
        setSections(result.getSections);
      } catch (e) {
        console.log("unable to list documents...");
        console.log(e);
      }
    };
    listSections();
  }, []);

  return (
    <>
      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col" style={{ width: "21rem" }}>
          <div className="h-0 flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 bg-gray-800 pt-2">
              <div>
                {sections.map((sectionData) => {
                  const isActiveSection = activeSections.includes(
                    sectionData.slug
                  );
                  return (
                    <>
                      <button
                        onClick={() => {
                          isActiveSection
                            ? setActiveSections([
                                ...activeSections.filter(
                                  (sec) => sec !== sectionData.slug
                                ),
                              ])
                            : setActiveSections([
                                ...activeSections,
                                sectionData.slug,
                              ]);
                        }}
                        className={`mt-1 group w-full flex items-center pr-2 py-2 text-sm leading-5 font-medium rounded-md text-gray-100 hover:bg-gray-600 hover:text-gray-200 focus:outline-none focus:text-gray-200 focus:bg-gray-600 transition ease-in-out duration-150`}
                      >
                        {/* Expanded: "text-gray-200 rotate-90", Collapsed: "text-gray-300" */}
                        <svg
                          className={`mr-2 h-5 w-5 transform group-hover:text-gray-200 group-focus:text-gray-200 transition-colors ease-in-out duration-150 ${
                            isActiveSection ? "rotate-90" : ""
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M6 6L14 10L6 14V6Z" fill="currentColor" />
                        </svg>
                        {sectionData.slug}
                      </button>
                      <div
                        className={`mt-1 space-y-1 ${
                          isActiveSection ? "" : "hidden"
                        }`}
                      >
                        {sectionData.documents?.map((document) => {
                          // FIXME: array with null is returned
                          if (!document) {
                            return null;
                          }
                          const activeStyles =
                            relativePath === document.sys.relativePath
                              ? "text-gray-200 bg-gray-600"
                              : "";
                          return (
                            <Link
                              href={`/graphiql/${sectionData.slug}/${document.sys.relativePath}`}
                            >
                              <a
                                className={`mb-1 group w-full flex items-center justify-between pl-10 pr-2 py-2 text-sm leading-5 font-medium text-gray-100 rounded-md hover:text-gray-200 hover:bg-gray-600 focus:outline-none focus:text-gray-200 focus:bg-gray-600 transition ease-in-out duration-150 ${activeStyles}`}
                              >
                                {document.sys.breadcrumbs.join("/")}
                              </a>
                            </Link>
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
