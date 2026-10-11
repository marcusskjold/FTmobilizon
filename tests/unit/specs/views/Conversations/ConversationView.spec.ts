import { beforeEach, describe, it, expect, vi, afterEach } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import ConversationView from "@/views/Conversations/ConversationView.vue";
import { DELETE_COMMENT, UPDATE_COMMENT } from "@/graphql/comment";
import {
  CONVERSATION_COMMENT_CHANGED,
  GET_CONVERSATION,
  MARK_CONVERSATION_AS_READ,
  REPLY_TO_PRIVATE_MESSAGE_MUTATION,
} from "@/graphql/conversations";
import { MemberRole } from "@/types/enums";
import { computed } from "vue";

config.global.plugins.push(Oruga);

let router: Router;

beforeEach(async () => {
  vi.mock("@/composition/apollo/actor", () => {
    return {
      useCurrentActorClient: () => {
        const error = null;
        const loading = null;
        const currentActor = computed(() => {
          return {
            id: 123,
            name: "test",
            domain: null,
            preferredUsername: "test",
          };
        });
        return { currentActor, error, loading };
      },
      useCurrentUserIdentities: () => {
        const error = null;
        const loading = null;
        const identities = computed(() => {
          return [
            {
              __typename: "Person",
              avatar: null,
              domain: null,
              id: "2",
              name: "test",
              preferredUsername: "test",
              summary: null,
              type: "PERSON",
              url: "http://mobilizon.test/@test",
            },
          ];
        });
        return { identities, error, loading };
      },
      usePersonStatusGroup: () => {
        const error = null;
        const loading = null;
        const person = computed(() => {
          return {
            memberships: {
              total: 1,
              elements: [
                {
                  role: MemberRole.ADMINISTRATOR,
                },
              ],
            },
          };
        });
        return { person, error, loading };
      },
    };
  });

  router = createRouter({
    history: createWebHistory(),
    routes: routes,
  });

  // await router.isReady();
});

const generateWrapper = () => {
  const conversation_mock = {
    data: {
      conversation: {
        __typename: "Conversation",
        id: 123456,
        conversationParticipantId: 987654,
        participants: [],
        actor: {
          __typename: "Person",
          preferredUsername: "username",
        },
        comments: {
          total: 0,
          elements: [],
        },
      },
    },
  };
  const global_data = getMockClient([
    CONVERSATION_COMMENT_CHANGED,
    [GET_CONVERSATION, conversation_mock],
    MARK_CONVERSATION_AS_READ,
    REPLY_TO_PRIVATE_MESSAGE_MUTATION,
    DELETE_COMMENT,
    UPDATE_COMMENT,
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(ConversationView, {
    props: {
      id: "456789",
    },
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

afterEach(async () => {
  await vi.dynamicImportSettled();
});

describe("ConversationView", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_5).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      id: "456789",
    });
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({
      id: "456789",
      limit: 10,
      page: 1,
    });
  });
});
