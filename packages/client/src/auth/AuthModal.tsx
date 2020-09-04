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

import {
  useCMS,
  Modal,
  ModalPopup,
  ModalHeader,
  ModalBody,
  ModalActions,
} from "tinacms";
import { StyleReset } from "@tinacms/styles";
import { AsyncButton } from "./AsyncButton";
import React from "react";
import styled from "styled-components";
// import "./auth.css"; // TODO - can't import css with current rollup config
export interface ForestryAuthenticationModalProps {
  onAuthSuccess(): void;
  close(): void;
}

export function ForestryAuthenticationModal({
  onAuthSuccess,
  close,
}: ForestryAuthenticationModalProps) {
  const cms = useCMS();
  return (
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
            await cms.api.forestry.authenticate();
            onAuthSuccess();
          },
          primary: true,
        },
      ]}
    />
  );
}

interface ModalBuilderProps {
  title: string;
  message: string;
  error?: string;
  actions: any[];
  close(): void;
}

export function ModalBuilder(modalProps: ModalBuilderProps) {
  return (
    <StyleReset>
      <Modal>
        <ModalPopup>
          <ModalHeader close={modalProps.close}>{modalProps.title}</ModalHeader>
          <ModalBody padded>
            <p>{modalProps.message}</p>
            {modalProps.error && <ErrorLabel>{modalProps.error}</ErrorLabel>}
          </ModalBody>
          <ModalActions>
            {modalProps.actions.map((action: any) => (
              <AsyncButton {...action} />
            ))}
          </ModalActions>
        </ModalPopup>
      </Modal>
    </StyleReset>
  );
}

export const ErrorLabel = styled.p`
  color: var(--tina-color-error) !important;
`;
