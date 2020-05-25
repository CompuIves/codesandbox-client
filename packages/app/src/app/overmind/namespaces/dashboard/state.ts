import {
  SidebarCollectionDashboardFragment as Collection,
  SandboxFragmentDashboardFragment as Sandbox,
  Team,
  TemplateFragmentDashboardFragment as Template,
} from 'app/graphql/types';
import isSameDay from 'date-fns/isSameDay';
import isSameMonth from 'date-fns/isSameMonth';
import isSameWeek from 'date-fns/isSameWeek';
import { sortBy } from 'lodash-es';
import { derived } from 'overmind';

export type OrderBy = {
  field: string;
  order: 'desc' | 'asc';
};

export type DELETE_ME_COLLECTION = Collection & {
  name: string;
  level: number;
  parent: string;
  sandboxes: number;
};

export enum sandboxesTypes {
  DRAFTS = 'DRAFTS',
  TEMPLATES = 'TEMPLATES',
  DELETED = 'DELETED',
  RECENT = 'RECENT',
  START_PAGE = 'START_PAGE',
  TEMPLATE_START_PAGE = 'TEMPLATE_START_PAGE',
  RECENT_START_PAGE = 'RECENT_START_PAGE',
  ALL = 'ALL',
  SEARCH = 'SEARCH',
}

type State = {
  sandboxes: {
    DRAFTS: Sandbox[] | null;
    TEMPLATES: Template[] | null;
    DELETED: Sandbox[] | null;
    RECENT: Sandbox[] | null;
    SEARCH: Sandbox[] | null;
    TEMPLATE_START_PAGE: Template[] | null;
    RECENT_START_PAGE: Sandbox[] | null;
    ALL: {
      [path: string]: Sandbox[];
    } | null;
  };
  teams: Array<{ __typename?: 'Team' } & Pick<Team, 'id' | 'name'>>;
  allCollections: DELETE_ME_COLLECTION[] | null;
  activeTeam: string | null;
  activeTeamInfo: any | null;
  selectedSandboxes: string[];
  trashSandboxIds: string[];
  isDragging: boolean;
  viewMode: 'grid' | 'list';
  orderBy: OrderBy;
  filters: {
    blacklistedTemplates: string[];
    search: string;
  };
  isTemplateSelected: (templateName: string) => boolean;
  getFilteredSandboxes: (sandboxes: Sandbox[]) => Sandbox[];
  recentSandboxesByTime: {
    day: Sandbox[];
    week: Sandbox[];
    month: Sandbox[];
    older: Sandbox[];
  };
  deletedSandboxesByTime: {
    week: Sandbox[];
    older: Sandbox[];
  };
};

export const state: State = {
  sandboxes: {
    DRAFTS: null,
    TEMPLATES: null,
    DELETED: null,
    RECENT: null,
    TEMPLATE_START_PAGE: null,
    RECENT_START_PAGE: null,
    ALL: null,
    SEARCH: null,
  },
  viewMode: 'grid',
  allCollections: null,
  activeTeam: null,
  activeTeamInfo: null,
  teams: [],
  recentSandboxesByTime: derived(({ sandboxes }: State) => {
    const recentSandboxes = sandboxes.RECENT;
    if (!recentSandboxes) {
      return {
        day: [],
        week: [],
        month: [],
        older: [],
      };
    }

    const noTemplateSandboxes = recentSandboxes.filter(s => !s.customTemplate);
    const timeSandboxes = noTemplateSandboxes.reduce(
      (accumulator, currentValue: any) => {
        if (!currentValue.updatedAt) return accumulator;
        if (isSameDay(new Date(currentValue.updatedAt), new Date())) {
          // these errors make no sense
          // @ts-ignore
          accumulator.day.push(currentValue);

          return accumulator;
        }
        if (isSameWeek(new Date(currentValue.updatedAt), new Date())) {
          // @ts-ignore
          accumulator.week.push(currentValue);

          return accumulator;
        }
        if (isSameMonth(new Date(currentValue.updatedAt), new Date())) {
          // @ts-ignore
          accumulator.month.push(currentValue);

          return accumulator;
        }

        // @ts-ignore
        accumulator.older.push(currentValue);

        return accumulator;
      },
      {
        day: [],
        week: [],
        month: [],
        older: [],
      }
    );

    return timeSandboxes;
  }),
  deletedSandboxesByTime: derived(({ sandboxes }: State) => {
    const deletedSandboxes = sandboxes.DELETED;
    if (!deletedSandboxes)
      return {
        week: [],
        older: [],
      };
    const noTemplateSandboxes = deletedSandboxes.filter(s => !s.customTemplate);
    const timeSandboxes = noTemplateSandboxes.reduce(
      (accumulator, currentValue) => {
        if (!currentValue.removedAt) return accumulator;
        if (isSameWeek(new Date(currentValue.removedAt), new Date())) {
          // these errors make no sense
          // @ts-ignore
          accumulator.week.push(currentValue);

          return accumulator;
        }
        // @ts-ignore
        accumulator.older.push(currentValue);

        return accumulator;
      },
      {
        week: [],
        older: [],
      }
    );

    return timeSandboxes;
  }),
  selectedSandboxes: [],
  trashSandboxIds: [],
  isDragging: false,
  orderBy: {
    order: 'desc',
    field: 'updatedAt',
  },
  filters: {
    blacklistedTemplates: [],
    search: '',
  },
  isTemplateSelected: derived(({ filters }: State) => templateName =>
    !filters.blacklistedTemplates.includes(templateName)
  ),
  getFilteredSandboxes: derived(({ orderBy, filters }: State) => sandboxes => {
    const orderField = orderBy.field;
    const orderOrder = orderBy.order;
    const { blacklistedTemplates } = filters;

    const isDateField =
      orderField === 'insertedAt' || orderField === 'updatedAt';

    let orderedSandboxes = (sortBy(sandboxes, s => {
      if (isDateField) {
        return +new Date(s[orderField]);
      }

      if (orderField === 'title') {
        return s.title || s.id;
      }

      return s[orderField];
    }) as Sandbox[]).filter(
      x =>
        x.source &&
        x.source.template &&
        blacklistedTemplates.indexOf(x.source.template) === -1
    );

    if (orderOrder === 'desc') {
      orderedSandboxes = orderedSandboxes.reverse();
    }

    return orderedSandboxes;
  }),
};
