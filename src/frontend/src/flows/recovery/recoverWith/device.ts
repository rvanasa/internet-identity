import { displayError } from "$src/components/displayError";
import { promptUserNumberTemplate } from "$src/components/promptUserNumber";
import { toast } from "$src/components/toast";
import {
  apiResultToLoginFlowResult,
  LoginFlowCanceled,
  LoginFlowError,
  LoginFlowSuccess,
} from "$src/utils/flowResult";
import { Connection } from "$src/utils/iiConnection";
import { renderPage } from "$src/utils/lit-html";

export const recoverWithDeviceTemplate = ({
  next,
  cancel,
}: {
  next: (userNumber: bigint) => void;
  cancel: () => void;
}) =>
  promptUserNumberTemplate({
    title: "Use Recovery Device",
    message:
      "Enter your Internet Identity and follow your browser's instructions to use your recovery device.",
    onContinue: (userNumber) => next(userNumber),
    onCancel: () => cancel(),
  });

export const recoverWithDevicePage = renderPage(recoverWithDeviceTemplate);

export const recoverWithDevice = ({
  connection,
}: {
  connection: Connection;
}): Promise<
  LoginFlowSuccess | LoginFlowError | LoginFlowCanceled /* TODO: squash */
> => {
  return new Promise((resolve) => {
    return recoverWithDevicePage({
      next: async (userNumber: bigint) => {
        const result = await attemptRecovery({ userNumber, connection });

        if (result.tag === "err") {
          await displayError({ ...result, primaryButton: "Try again" });
          // TODO: then what? toast.error?
          return;
        }

        if (result.tag === "canceled") {
          await displayError({
            title: "canceled",
            message: "foo",
            primaryButton: "U canceled",
          });
          // TODO: then what? toast.error?
          return;
        }

        result.tag satisfies "ok";

        return resolve(result);
      },
      cancel: () => resolve({ tag: "canceled" }),
    });
  });
};

const attemptRecovery = async ({
  userNumber,
  connection,
}: {
  userNumber: bigint;
  connection: Connection;
}): Promise<LoginFlowSuccess | LoginFlowError | LoginFlowCanceled> => {
  const { recovery_credentials: recoveryCredentials } =
    await connection.lookupCredentials(userNumber);

  if (recoveryCredentials.length === 0) {
    // TODO:  error no recovery device
    toast.error("No recovery for this number!!");
    throw new Error("TODO");
  }

  if (recoveryCredentials.length > 1) {
    // TODO:  toast: multiple devices
    toast.error("More than one recovery device found, this is unexpected");
    throw new Error("TODO");
  }

  const result = apiResultToLoginFlowResult(
    await connection.fromWebauthnCredentials(userNumber, [
      recoveryCredentials[0],
    ])
  );

  return result;
};
