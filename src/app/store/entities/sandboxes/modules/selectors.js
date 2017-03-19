export const modulesSelector = state => state.entities.modules;
export const isMainModule = module =>
  module.title === 'index.js' && module.directoryId == null;

function findById(entities, id) {
  return entities.find(e => e.id === id);
}

export const getModulePath = (modules, directories, id) => {
  const module = findById(modules, id);

  if (!module) return '';

  let directory = findById(directories, module.directoryId);
  let path = '/';
  while (directory != null) {
    path = `/${directory.title}${path}`;
    directory = findById(directories, directory.directoryId);
  }
  return path;
};
