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
import { TinaCloudAuthenticationModal } from "./AuthModal";
import { Client } from "../client";

interface ProviderProps {
  children: any;
  onLogin: (token: string) => string; // returns token
  onLogout: () => void;
  error?: any;
}

type ModalNames = null | "authenticate";

export const TinaCloudProvider = ({
  children,
  onLogin,
  onLogout,
}: ProviderProps) => {
  const cms = useCMS();
  const client: Client = cms.api.tina;
  const [activeModal, setActiveModal] = useState<ModalNames>(null);

  const onClose = async () => {
    setActiveModal(null);
    if (!(await client.isAuthorized())) {
      cms.disable();
    }
  };

  const beginAuth = async () => {
    setActiveModal("authenticate");
  };

  const onAuthSuccess = async (token: string) => {
    if (await client.isAuthorized()) {
      onLogin(token);
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
        <TinaCloudAuthenticationModal
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