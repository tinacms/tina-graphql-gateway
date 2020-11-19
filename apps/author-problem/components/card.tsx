import React from "react";

export const Card = (props: {
  image?: string;
  hashtags?: string[];
  title?: string;
  excerpt?: string;
  author?: {
    name?: string;
    image?: string;
  };
}) => {
  return (
    <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
      <div className="flex-shrink-0">
        <img className="h-48 w-full object-cover" src={props.image} alt="" />
      </div>
      <div className="flex-1 bg-white p-6 flex flex-col justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-indigo-600">
            <a href="#" className="hover:underline">
              {props.hashtags.join(", ")}
            </a>
          </p>
          <a href="#" className="block mt-2">
            <p className="text-xl font-semibold text-gray-900">{props.title}</p>
            <p className="mt-3 text-base text-gray-500">{props.excerpt}</p>
          </a>
        </div>
        <div className="mt-6 flex items-center">
          <div className="flex-shrink-0">
            <a href="#">
              <span className="sr-only">{props.author.name}</span>
              <img
                className="h-10 w-10 rounded-full"
                src={props.author.image}
                alt=""
              />
            </a>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              <a href="#" className="hover:underline">
                {props.author.name}
              </a>
            </p>
            <div className="flex space-x-1 text-sm text-gray-500">
              <span>6 min read</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
