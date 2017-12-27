import { types } from 'mobx-state-tree';

const Sandbox = types.model({
  forkCount: types.number,
  git: types.maybe(types.string),
  id: types.string,
  insertedAt: types.string,
  likeCount: types.number,
  privacy: types.number,
  template: types.string,
  title: types.maybe(types.string),
  updatedAt: types.string,
  viewCount: types.number,
});

export default {
  profiles: types.map(
    types.model({
      viewCount: types.number,
      username: types.string,
      subscriptionSince: types.string,
      showcasedSandboxShortid: types.string,
      sandboxCount: types.number,
      receivedLikeCount: types.number,
      name: types.string,
      id: types.string,
      givenLikeCount: types.number,
      forkedCount: types.number,
      badges: types.array(
        types.model({
          visible: types.boolean,
          name: types.string,
          id: types.string,
        })
      ),
      avatarUrl: types.string,
    })
  ),
  currentProfileId: types.maybe(types.string),
  notFound: types.boolean,
  isLoadingProfile: types.boolean,
  sandboxes: types.map(types.map(types.array(Sandbox))),
  likedSandboxes: types.map(types.map(types.array(Sandbox))),
  userSandboxes: types.array(Sandbox),
  currentSandboxesPage: types.number,
  currentLikedSandboxesPage: types.number,
  isLoadingSandboxes: types.boolean,
  showSelectSandboxModal: types.boolean,
  sandboxToDeleteIndex: types.maybe(types.number),
};
