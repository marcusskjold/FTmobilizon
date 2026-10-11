import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import DiscussionView from "@/views/Discussions/DiscussionView.vue";
import { MemberRole } from "@/types/enums";
import { computed } from "vue";
import {
  DELETE_DISCUSSION,
  DISCUSSION_COMMENT_CHANGED,
  GET_DISCUSSION,
  REPLY_TO_DISCUSSION,
  UPDATE_DISCUSSION,
} from "@/graphql/discussion";
import { DELETE_COMMENT, UPDATE_COMMENT } from "@/graphql/comment";
import { PERSON_MEMBERSHIPS } from "@/graphql/actor";

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

config.global.plugins.push(Oruga);

let router: Router;

beforeEach(async () => {
  router = createRouter({
    history: createWebHistory(),
    routes: routes,
  });

  // await router.isReady();
});

afterEach(async () => {
  await vi.dynamicImportSettled();
});

const generateWrapper = () => {
  const discussion_mock = {
    data: {
      discussion: {
        __typename: "Discussion",
        comments: {
          total: 0,
          elements: [],
        },
      },
    },
  };
  const global_data = getMockClient([
    [GET_DISCUSSION, discussion_mock],
    REPLY_TO_DISCUSSION,
    UPDATE_DISCUSSION,
    DELETE_DISCUSSION,
    DISCUSSION_COMMENT_CHANGED,
    DELETE_COMMENT,
    UPDATE_COMMENT,
    PERSON_MEMBERSHIPS,
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(DiscussionView, {
    props: {
      slug: "azerty",
    },
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("DiscussionView", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_5).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_6).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_7).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      limit: 10,
      page: 1,
      slug: "azerty",
    });
    expect(requestHandlers.handle_7).toHaveBeenCalledWith({
      id: 123,
    });
  });
});
