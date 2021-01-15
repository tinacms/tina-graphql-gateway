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
import { useCMS, TinaProvider, TinaCMS } from "tinacms";
import { useTinaAuthRedirect } from "./useTinaAuthRedirect";
import type { TokenObject } from "./authenticate";
import { TinaCloudAuthenticationModal, ModalBuilder } from "./AuthModal";
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

const LoginScreen = () => {
  return <div>Please wait while we log you in</div>;
};

export const AuthWallInner = ({
  children,
  cms,
  loginScreen,
}: {
  cms: TinaCMS;
  children: React.ReactNode;
  loginScreen?: React.ReactNode;
}) => {
  const client: Client = cms.api.tina;

  const [activeModal, setActiveModal] = useState<ModalNames>(null);
  const [showChildren, setShowChildren] = useState<boolean>(false);

  React.useEffect(() => {
    beginAuth();
  }, []);

  const beginAuth = async () => {
    const user = await client.getUser();
    if (!user) {
      setActiveModal("authenticate");
    } else {
      cms.enable();
    }
  };

  const onAuthSuccess = async (token: TokenObject) => {
    if (await client.isAuthorized()) {
      cms.enable();
      setActiveModal(null);
    } else {
      throw new Error("No access to repo"); // TODO - display modal here
    }
  };

  useCMSEvent("cms:enable", () => setShowChildren(true), []);
  useCMSEvent("cms:disable", () => setShowChildren(true), []);

  return (
    <>
      {activeModal === "authenticate" && (
        <ModalBuilder
          title="Forestry Authorization"
          message="To save edits, Tina requires Forestry authorization. On save, changes will get commited to Forestry using your account."
          close={close}
          actions={[
            {
              name: "Cancel",
              action: close,
            },
            {
              name: "Continue to Forestry",
              action: async () => {
                const token = await client.authenticate();
                onAuthSuccess(token);
              },
              primary: true,
            },
          ]}
        />
      )}
      {showChildren ? children : loginScreen ? loginScreen : <LoginScreen />}
    </>
  );
};

export const TinaCloudAuthWall = (props: {
  cms: TinaCMS;
  children: React.ReactNode;
  loginScreen?: React.ReactNode;
}) => {
  useTinaAuthRedirect();

  return (
    <TinaProvider cms={props.cms}>
      <AuthWallInner {...props} />
    </TinaProvider>
  );
};
