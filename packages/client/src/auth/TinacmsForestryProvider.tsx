/**

Copyright 2019 Forestry.io Inc

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

import React, { useState, useEffect } from "react";
import { useCMS } from "tinacms";
import { ForestryAuthenticationModal } from "./AuthModal";
import { ForestryClient } from "../client";

interface ProviderProps {
  children: any;
  onLogin: () => void;
  onLogout: () => void;
  error?: any;
}

type ModalNames = null | "authenticate";

export const TinacmsForestryProvider = ({
  children,
  onLogin,
  onLogout,
}: ProviderProps) => {
  const cms = useCMS();
  const forestry: ForestryClient = cms.api.forestry;
  const [activeModal, setActiveModal] = useState<ModalNames>(null);

  const onClose = async () => {
    setActiveModal(null);
    if (!(await forestry.isAuthorized())) {
      cms.disable();
    }
  };

  const beginAuth = async () => {
    if (await forestry.isAuthenticated()) {
      onAuthSuccess();
    } else {
      setActiveModal("authenticate");
    }
  };

  const onAuthSuccess = async () => {
    if (await forestry.isAuthorized()) {
      onLogin();
      setActiveModal(null);
    } else {
      throw new Error("No access to repo"); // TODO - display modal here
    }
  };

  useCMSEvent("cms:enable", beginAuth, []);
  useCMSEvent("cms:disable", onLogout, []);

  return (
    <div>
      {activeModal === "authenticate" && (
        <ForestryAuthenticationModal
          close={onClose}
          onAuthSuccess={onAuthSuccess}
        />
      )}
      {children}
    </div>
  );
};

function useCMSEvent(event: string, callback: any, deps: React.DependencyList) {
  const cms = useCMS();
  useEffect(function () {
    return cms.events.subscribe(event, callback);
  }, deps);
}
