import { Modal, ModalPopup, ModalBody } from "tinacms";
import { useTinaAuthRedirect } from "@forestryio/client";

export default function Authenticating() {
  useTinaAuthRedirect();

  return (
    <Modal>
      <ModalPopup>
        <ModalBody padded>
          <p>Authorizing with Tina, Please wait...</p>
        </ModalBody>
      </ModalPopup>
    </Modal>
  );
}
