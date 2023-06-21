import { WebAuthnCredential } from "$generated/internet_identity_types";
import { displayError } from "$src/components/displayError";
import { mainWindow } from "$src/components/mainWindow";
import {
  promptUserNumber,
  promptUserNumberTemplate,
} from "$src/components/promptUserNumber";
import { toast } from "$src/components/toast";
import {
  apiResultToLoginFlowResult,
  cancel,
  LoginFlowCanceled,
  LoginFlowError,
  LoginFlowSuccess,
} from "$src/utils/flowResult";
import { Connection } from "$src/utils/iiConnection";
import { renderPage } from "$src/utils/lit-html";
import { unreachable } from "$src/utils/utils";
import { html, render } from "lit-html";

const pageContent = () => {
  const pageContentSlot = html`
    <article>
      <hgroup>
        <h1 class="t-title t-title--main">Use Recovery Device</h1>
        <p class="t-lead">
          Click <strong class="t-strong">continue</strong> and follow your
          browser's instructions to recover your Internet Identity with external
          hardware.
        </p>
      </hgroup>
      <div class="c-button-group">
        <button
          id="recover-with-device__cancel"
          class="c-button c-button--secondary"
        >
          Cancel
        </button>
        <button
          id="recover-with-device__continue"
          class="c-button c-button--primary"
        >
          Continue
        </button>
      </div>
    </article>
  `;

  return mainWindow({
    showLogo: false,
    showFooter: false,
    slot: pageContentSlot,
  });
};

export const deviceRecoveryyPage = (
  userNumber: bigint,
  connection: Connection,
  recoveryCredentials: WebAuthnCredential
): Promise<LoginFlowSuccess | LoginFlowCanceled> => {
  const container = document.getElementById("pageContent") as HTMLElement;
  render(pageContent(), container);
  return init(userNumber, connection, recoveryCredentials);
};

const init = (
  userNumber: bigint,
  connection: Connection,
  recoveryCredentials: WebAuthnCredential
): Promise<LoginFlowSuccess | LoginFlowCanceled> =>
  new Promise((resolve) => {
    const buttonContinue = document.getElementById(
      "recover-with-device__continue"
    ) as HTMLButtonElement | null;
    if (buttonContinue !== null) {
      buttonContinue.onclick = async () => {
        const result = apiResultToLoginFlowResult(
          await connection.fromWebauthnCredentials(userNumber, [
            recoveryCredentials,
          ])
        );

        switch (result.tag) {
          case "ok":
            resolve(result);
            break;
          case "err":
            await displayError({ ...result, primaryButton: "Try again" });
            void deviceRecoveryyPage(
              userNumber,
              connection,
              recoveryCredentials
            ).then((res) => resolve(res));
            break;
          default:
            unreachable(result);
            break;
        }
      };
    }

    const buttonCancel = document.getElementById(
      "recover-with-device__cancel"
    ) as HTMLButtonElement | null;
    if (buttonCancel !== null) {
      buttonCancel.onclick = () => {
        resolve(cancel);
      };
    }
  });

export const deviceRecoveryTemplate = ({
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

export const deviceRecoveryPage = renderPage(deviceRecoveryTemplate);

export const deviceRecovery = ({
  connection,
  recoveryCredentials,
}: {
  connection: Connection;
  recoveryCredentials: WebAuthnCredential;
}): Promise<
  LoginFlowSuccess | LoginFlowError | LoginFlowCanceled /* TODO: squash */
> => {
  return new Promise((resolve) => {
    return deviceRecoveryPage({
      next: async (userNumber: bigint) => {
        const result = apiResultToLoginFlowResult(
          await connection.fromWebauthnCredentials(userNumber, [
            recoveryCredentials,
          ])
        );

        if (result.tag === "err") {
          await displayError({ ...result, primaryButton: "Try again" });
          // TODO: then what? toast.error?
          return;
        }

        result.tag satisfies "ok";

        return resolve(result);
      },
      cancel: () => resolve({ tag: "canceled" }),
    });
    // TODO:
  });
};

export const recoverWithDevice = async ({
  connection,
}: {
  connection: Connection;
}): Promise<LoginFlowSuccess | LoginFlowError | LoginFlowCanceled> => {
  const userNumber = await promptUserNumber({
    title: "Recover Internet Identity",
  });

  if (userNumber === "canceled") {
    return { tag: "canceled" };
  }

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

  return await deviceRecovery({
    connection,
    recoveryCredentials: recoveryCredentials[0],
  });
};
