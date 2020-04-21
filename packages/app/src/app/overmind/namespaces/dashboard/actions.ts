import { Action, AsyncAction } from 'app/overmind';
import { withLoadApp } from 'app/overmind/factories';
import { Direction } from 'app/graphql/types';
import { OrderBy } from './state';

export const dashboardMounted: AsyncAction = withLoadApp();

export const sandboxesSelected: Action<{
  sandboxIds: string[];
}> = ({ state }, { sandboxIds }) => {
  state.dashboard.selectedSandboxes = sandboxIds;
};

export const setTrashSandboxes: Action<{
  sandboxIds: string[];
}> = ({ state }, { sandboxIds }) => {
  state.dashboard.trashSandboxIds = sandboxIds;
};

export const dragChanged: Action<{ isDragging: boolean }> = (
  { state },
  { isDragging }
) => {
  state.dashboard.isDragging = isDragging;
};

export const orderByChanged: Action<OrderBy> = ({ state }, orderBy) => {
  state.dashboard.orderBy = orderBy;
};

export const blacklistedTemplateAdded: Action<string> = (
  { state },
  template
) => {
  state.dashboard.filters.blacklistedTemplates.push(template);
};

export const blacklistedTemplateRemoved: Action<string> = (
  { state },
  template
) => {
  state.dashboard.filters.blacklistedTemplates = state.dashboard.filters.blacklistedTemplates.filter(
    currentTemplate => currentTemplate !== template
  );
};

export const blacklistedTemplatesCleared: Action = ({ state }) => {
  state.dashboard.filters.blacklistedTemplates = [];
};

export const blacklistedTemplatesChanged: Action<string[]> = (
  { state },
  templates
) => {
  state.dashboard.filters.blacklistedTemplates = templates;
};

export const searchChanged: Action<{ search: string }> = (
  { state },
  { search }
) => {
  state.dashboard.filters.search = search;
};

export const createSandboxClicked: AsyncAction<{
  body: { collectionId: string };
  sandboxId: string;
}> = ({ actions }, { body, sandboxId }) =>
  actions.editor.forkExternalSandbox({ body, sandboxId });

export const deleteTemplate: AsyncAction<{
  sandboxId: string;
  templateId: string;
}> = async ({ actions, effects }, { sandboxId, templateId }) => {
  try {
    effects.analytics.track('Template - Removed', { source: 'Context Menu' });
    await effects.api.deleteTemplate(sandboxId, templateId);
    actions.modalClosed();
    effects.notificationToast.success('Template Deleted');
  } catch (error) {
    effects.notificationToast.error('Could not delete custom template');
  }
};

export const getRecentSandboxes: AsyncAction = async ({ state, effects }) => {
  const { dashboard, user } = state;
  dashboard.loadingPage = true;
  if (!user) return;
  try {
    const data = await effects.gql.queries.recentSandboxesPage({
      orderField: dashboard.orderBy.field,
      orderDirection: dashboard.orderBy.order.toUpperCase() as Direction,
    });
    if (!data || !data.me) {
      return;
    }

    dashboard.recentSandboxes = data.me.sandboxes;
    dashboard.loadingPage = false;
  } catch (error) {
    dashboard.loadingPage = false;
    effects.notificationToast.error(
      'There was a problem getting your recent Sandboxes'
    );
  }
};

export const getDrafts: AsyncAction = async ({ state, effects }) => {
  const { dashboard, user } = state;
  dashboard.loadingPage = true;
  if (!user) return;
  try {
    const data = await effects.gql.queries.sandboxesByPath({
      path: '/',
      teamId: null,
    });
    if (!data || !data.me || !data.me.collection) {
      return;
    }

    dashboard.draftSandboxes = data.me.collection.sandboxes.filter(
      s => !s.customTemplate
    );
    dashboard.loadingPage = false;
  } catch (error) {
    dashboard.loadingPage = false;
    effects.notificationToast.error(
      'There was a problem getting your recent Sandboxes'
    );
  }
};

export const getDeletedSandboxes: AsyncAction = async ({ state, effects }) => {
  const { dashboard, user } = state;
  dashboard.loadingPage = true;
  if (!user) return;
  try {
    const data = await effects.gql.queries.deletedSandboxes({});
    if (!data || !data.me) {
      return;
    }

    dashboard.deletedSandboxes = data.me.sandboxes;
    dashboard.loadingPage = false;
  } catch (error) {
    dashboard.loadingPage = false;
    effects.notificationToast.error(
      'There was a problem getting your recent Sandboxes'
    );
  }
};
