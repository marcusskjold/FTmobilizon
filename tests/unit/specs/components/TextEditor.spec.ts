import { beforeEach, describe, it, expect } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../mocks/client";
import { htmlRemoveId } from "../common";
import TextEditor from "@/components/TextEditor.vue";
import { IPerson } from "@/types/actor";
import { ActorType } from "@/types/enums";
import { setup_test_tiptap } from "../mocks/tiptap";

config.global.plugins.push(Oruga);

let router: Router;

beforeEach(async () => {
  router = createRouter({
    history: createWebHistory(),
    routes: routes,
  });

  setup_test_tiptap();
});

const current_person: IPerson = {
  id: "123",
  feedTokens: [],
  url: "123",
  name: "123",
  domain: null,
  summary: "",
  preferredUsername: "123",
  suspended: false,
  type: ActorType.PERSON,
};

const generateWrapper = () => {
  const global_data = getMockClient([]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(TextEditor, {
    props: {
      modelValue: "",
      ariaLabel: "",
      currentActor: current_person,
      placeholder: "help",
    },
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("TextEditor", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
  });
});
