import { AUTH_USER_ACTOR_ID } from "@/constants";
import {
  UPDATE_CURRENT_ACTOR_CLIENT,
  UPDATE_DEFAULT_ACTOR,
} from "@/graphql/actor";
import { IPerson } from "@/types/actor";
import { apolloClient } from "@/vue-apollo";
import { provideApolloClient, useMutation } from "@vue/apollo-composable";

export class NoIdentitiesException extends Error {}

function saveActorData(obj: IPerson): void {
  localStorage.setItem(AUTH_USER_ACTOR_ID, `${obj.id}`);
}

// Update the current actor locally
// so the app knows which one is selected
const {
  mutate: updateCurrentActorClient,
  onError: onUpdateCurrentActorClientError,
} = provideApolloClient(apolloClient)(() =>
  useMutation(UPDATE_CURRENT_ACTOR_CLIENT)
);

// Update the current actor locally on the server
// so the server knows which actor to use when a request is sent without an actor
const {
  mutate: updateCurrentActorServer,
  onError: onUpdateCurrentActorServerError,
} = provideApolloClient(apolloClient)(() =>
  useMutation<{
    changeDefaultActor: { id: string; defaultActor: { id: string } };
  }>(UPDATE_DEFAULT_ACTOR)
);

export async function changeIdentity(identity: IPerson) {
  if (!identity.id) {
    console.error("identity.id is not set");
    return;
  }

  console.debug("Changing identity", identity);

  updateCurrentActorServer({
    preferredUsername: identity.preferredUsername,
  });

  updateCurrentActorClient(identity);

  saveActorData(identity);
}

onUpdateCurrentActorClientError((e) => {
  console.error(e);
  alert(e);
});

onUpdateCurrentActorServerError((e) => {
  console.error(e);
  alert(e);
});

/**
 * We fetch from localStorage the latest actor ID used,
 * then fetch the current identities to set in cache
 * the current identity used
 */
export async function initializeCurrentActor(
  identities: IPerson[] | undefined
): Promise<void> {
  const actorId = localStorage.getItem(AUTH_USER_ACTOR_ID);
  console.debug("Initializing current actor", actorId);

  if (!identities) {
    console.debug("Failed to load user's identities", identities);
    return;
  }

  if (identities.length < 1) {
    console.warn("Logged user has no identities!");
    throw new NoIdentitiesException();
  }
  const activeIdentity =
    (identities || []).find(
      (identity: IPerson | undefined) => identity?.id === actorId
    ) || ((identities || [])[0] as IPerson);

  if (activeIdentity) {
    await changeIdentity(activeIdentity);
  }
}
