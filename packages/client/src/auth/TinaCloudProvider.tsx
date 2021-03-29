/**
Copyright 2021 Forestry.io Holdings, Inc.
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

import { ModalBuilder, TinaCloudAuthenticationModal } from "./AuthModal";
import React, { useEffect, useState } from "react";
import { TinaCMS, TinaProvider, useCMS } from "tinacms";

import { Client } from "../client";
import type { TokenObject } from "./authenticate";
import { useTinaAuthRedirect } from "./useTinaAuthRedirect";

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    client.isAuthenticated().then((isAuthenticated) => {
      if (isAuthenticated) {
        setShowChildren(true);
        cms.enable();
      } else {
        // FIXME: might be some sort of race-condition when loading styles
        sleep(500).then(() => {
          setActiveModal("authenticate");
        });
      }
    });
  }, []);

  const onAuthSuccess = async (token: TokenObject) => {
    if (await client.isAuthenticated()) {
      setShowChildren(true);
      setActiveModal(null);
    } else {
      throw new Error("No access to repo"); // TODO - display modal here
    }
  };

  return (
    <>
      {activeModal === "authenticate" && (
        <ModalBuilder
          title="Tina Cloud Authorization"
          message="To save edits, Tina Cloud authorization is required. On save, changes will get commited using your account."
          close={close}
          actions={[
            {
              name: "Cancel",
              action: close,
            },
            {
              name: "Continue to Tina Cloud",
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

/**
 * Provides an authentication wall so Tina is not enabled without a valid user session.
 *
 * Note: this will not restrict access for local filesystem clients
 */
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
