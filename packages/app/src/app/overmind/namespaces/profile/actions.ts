import { Sandbox } from '@codesandbox/common/lib/types';
import { Action, AsyncAction } from 'app/overmind';
import { withLoadApp } from 'app/overmind/factories';

export const profileMounted: AsyncAction<string> = withLoadApp(
  async ({ effects, state }, username) => {
    state.profile.isLoadingProfile = true;
    state.profile.notFound = false;

    const profile = await effects.api.getProfile(username);

    state.profile.profiles[profile.id] = profile;
    state.profile.currentProfileId = profile.id;

    if (
      profile.showcasedSandboxShortid &&
      !state.editor.sandboxes[profile.showcasedSandboxShortid]
    ) {
      state.editor.sandboxes[
        profile.showcasedSandboxShortid
      ] = await effects.api.getSandbox(profile.showcasedSandboxShortid);
    }

    state.profile.isLoadingProfile = false;
  }
);

export const fetchSandboxes: AsyncAction = async ({ effects, state }) => {
  if (!state.profile.current) return;

  state.profile.isLoadingSandboxes = true;

  const { username } = state.profile.current;
  const {
    currentSandboxesPage: page,
    currentSortBy: sortBy,
    currentSortDirection: direction,
  } = state.profile;

  const data = await effects.api.getUserSandboxes(
    username,
    page,
    sortBy,
    direction
  );

  if (!state.profile.sandboxes[username]) {
    state.profile.sandboxes[username] = {};
  }

  state.profile.sandboxes[username][page] = data[page];
  state.profile.isLoadingSandboxes = false;
};

export const sandboxesPageChanged: Action<number> = (
  { state, actions },
  page
) => {
  state.profile.currentSandboxesPage = page;
  actions.profile.fetchSandboxes();
};

export const sortByChanged: Action<'view_count' | 'inserted_at'> = (
  { state, actions },
  sortBy
) => {
  state.profile.currentSortBy = sortBy;
  state.profile.currentSandboxesPage = 1;
  actions.profile.fetchSandboxes();
};

export const sortDirectionChanged: Action<'asc' | 'desc'> = (
  { state, actions },
  direction
) => {
  state.profile.currentSortDirection = direction;
  state.profile.currentSandboxesPage = 1;
  actions.profile.fetchSandboxes();
};

export const likedSandboxesPageChanged: AsyncAction<number> = async (
  { effects, state },
  page
) => {
  state.profile.isLoadingSandboxes = true;
  state.profile.currentLikedSandboxesPage = page;

  if (!state.profile.current) {
    return;
  }

  const { username } = state.profile.current;

  if (
    !state.profile.likedSandboxes[username] ||
    !state.profile.likedSandboxes[username][page]
  ) {
    const data = await effects.api.getUserLikedSandboxes(username, page);
    const sandboxes = data[page];

    if (!state.profile.likedSandboxes[username]) {
      state.profile.likedSandboxes[username] = {};
    }

    state.profile.likedSandboxes[username][page] = sandboxes;
  }

  state.profile.isLoadingSandboxes = false;
};

export const selectSandboxClicked: AsyncAction = async ({ state, effects }) => {
  state.currentModal = 'selectSandbox';

  if (!state.profile.userSandboxes.length) {
    state.profile.isLoadingSandboxes = true;
    state.profile.userSandboxes = await effects.api.getSandboxes();
    state.profile.isLoadingSandboxes = false;
  }
};

export const newSandboxShowcaseSelected: AsyncAction<string> = async (
  { state, effects },
  id
) => {
  state.currentModal = null;

  if (!state.profile.currentProfileId) {
    return;
  }

  state.profile.profiles[
    state.profile.currentProfileId
  ].showcasedSandboxShortid = id;
  state.profile.isLoadingProfile = true;

  if (!state.user) {
    return;
  }

  const [sandbox] = await Promise.all([
    state.editor.sandboxes[id] ? null : effects.api.getSandbox(id),
    effects.api.updateShowcasedSandbox(state.user.username, id),
  ]);

  if (sandbox) {
    state.editor.sandboxes[id] = sandbox as Sandbox;
  }

  state.profile.isLoadingProfile = false;
};

export const deleteSandboxClicked: Action<string> = ({ state }, id) => {
  state.profile.sandboxToDeleteId = id;
  state.currentModal = 'deleteProfileSandbox';
};

export const sandboxDeleted: AsyncAction = async ({ state, effects }) => {
  state.profile.isLoadingSandboxes = true;
  state.currentModal = null;

  const sandboxId = state.profile.sandboxToDeleteId;

  if (!sandboxId || !state.profile.current || !state.user) {
    return;
  }

  await effects.api.deleteSandbox(sandboxId);

  state.profile.current.sandboxCount--;

  const page = state.profile.currentSandboxesPage;
  const { username } = state.user;
  const data = await effects.api.getUserSandboxes(username, page);

  state.profile.sandboxes[username][page] = data[page];

  state.profile.isLoadingSandboxes = false;
};

export const updateUserProfile: AsyncAction<{
  bio: string;
  socialLinks: string[];
}> = async ({ actions, effects, state }, { bio, socialLinks }) => {
  if (!state.profile.current) return;

  // optimistic update
  const oldBio = state.profile.current.bio;
  state.profile.current.bio = bio;
  const oldSocialLinks = state.profile.current.socialLinks;
  state.profile.current.socialLinks = socialLinks;

  try {
    await effects.api.updateUserProfile(
      state.profile.current.id,
      bio,
      socialLinks
    );
  } catch (error) {
    // revert optimistic update
    state.profile.current.bio = oldBio;
    state.profile.current.socialLinks = oldSocialLinks;

    actions.internal.handleError({
      message: "We weren't able to update your bio",
      error,
    });
  }
};

export const addFeaturedSandboxesInState: Action<{
  sandboxId: string;
}> = ({ state, actions, effects }, { sandboxId }) => {
  if (!state.profile.current) return;

  const username = state.profile.current.username;
  const page = state.profile.currentSandboxesPage;
  const sandboxesOnPage = state.profile.sandboxes[username][page];

  const sandbox = sandboxesOnPage.find(s => s.id === sandboxId);

  state.profile.current.featuredSandboxes = [
    ...state.profile.current.featuredSandboxes,
    sandbox!,
  ];
};

export const removeFeaturedSandboxesInState: Action<{
  sandboxId: string;
}> = ({ state, actions, effects }, { sandboxId }) => {
  if (!state.profile.current) return;

  state.profile.current.featuredSandboxes = state.profile.current.featuredSandboxes.filter(
    sandbox => sandbox.id !== sandboxId
  );
};

export const addFeaturedSandboxes: AsyncAction<{
  sandboxId: string;
}> = async ({ actions, effects, state }, { sandboxId }) => {
  if (!state.profile.current) return;

  const currentFeaturedSandboxIds = state.profile.current.featuredSandboxes.map(
    sandbox => sandbox.id
  );

  // optimistic update
  actions.profile.addFeaturedSandboxesInState({ sandboxId });

  try {
    const profile = await effects.api.updateUserFeaturedSandboxes(
      state.profile.current.id,
      [...currentFeaturedSandboxIds, sandboxId]
    );

    state.profile.current.featuredSandboxes = profile.featuredSandboxes;
  } catch (error) {
    // rollback optimisic update
    actions.profile.removeFeaturedSandboxesInState({ sandboxId });

    actions.internal.handleError({
      message: "We weren't able to update your pinned sandboxes",
      error,
    });
  }
};

export const removeFeaturedSandboxes: AsyncAction<{
  sandboxId: string;
}> = async ({ actions, effects, state }, { sandboxId }) => {
  if (!state.profile.current) return;

  const filteredSandboxIds = state.profile.current.featuredSandboxes
    .map(sandbox => sandbox.id)
    .filter(id => id !== sandboxId);

  // optimisic update
  actions.profile.removeFeaturedSandboxesInState({ sandboxId });

  try {
    const profile = await effects.api.updateUserFeaturedSandboxes(
      state.profile.current.id,
      filteredSandboxIds
    );

    state.profile.current.featuredSandboxes = profile.featuredSandboxes;
  } catch (error) {
    // rollback optimisic update
    actions.profile.addFeaturedSandboxesInState({ sandboxId });

    actions.internal.handleError({
      message: "We weren't able to update your pinned sandboxes",
      error,
    });
  }
};

export const changeSandboxPrivacyInState: Action<{
  sandboxId: string;
  privacy: 0 | 1 | 2;
}> = ({ state, actions, effects }, { sandboxId, privacy }) => {
  if (!state.profile.current) {
    return;
  }

  const username = state.profile.current.username;
  const page = state.profile.currentSandboxesPage;
  const sandboxes = state.profile.sandboxes[username][page];

  state.profile.sandboxes[username][page] = sandboxes.map(sandbox => {
    if (sandbox.id === sandboxId) sandbox.privacy = privacy;
    return sandbox;
  });
};

export const changeSandboxPrivacy: AsyncAction<{
  sandboxId: string;
  privacy: 0 | 1 | 2;
}> = async ({ state, actions, effects }, { sandboxId, privacy }) => {
  // optimisitc update
  actions.profile.changeSandboxPrivacyInState({ sandboxId, privacy });

  try {
    await effects.api.updatePrivacy(sandboxId, privacy);
  } catch (error) {
    // rollback optimistic update
    // it is safe to assume that the sandbox was public (privacy:0)
    // earlier because it was on profiles
    actions.profile.changeSandboxPrivacyInState({ sandboxId, privacy: 0 });

    actions.internal.handleError({
      message: "We weren't able to update sandbox privacy",
      error,
    });
  }
};

export const fetchAllSandboxes: AsyncAction = async ({ effects, state }) => {
  if (!state.profile.current) return;

  const { username } = state.profile.current;
  const page = 'all';

  if (!state.profile.sandboxes[username]) {
    state.profile.sandboxes[username] = {};
  }

  if (state.profile.sandboxes[username][page]) return;

  state.profile.isLoadingSandboxes = true;
  const data = await effects.api.getUserSandboxes(username, page);
  state.profile.sandboxes[username][page] = data.sandboxes;
  state.profile.isLoadingSandboxes = false;
};

export const searchQueryChanged: AsyncAction<string> = async (
  { state, actions, effects },
  query
) => {
  state.profile.searchQuery = query;

  // Search works on all sandboxes
  // We check for isLoading to avoid multiple requests
  if (!state.profile.isLoadingSandboxes) {
    await actions.profile.fetchAllSandboxes();
  }
};
