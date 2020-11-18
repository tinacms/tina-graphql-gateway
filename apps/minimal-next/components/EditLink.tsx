//...EditLink.tsx
import { useCMS } from "tinacms";

export const EditLink = () => {
  const cms = useCMS();

  return (
    <button onClick={() => cms.toggle()}>
      {cms.enabled ? "Exit Edit Mode" : "Edit This Site"}
    </button>
  );
};
