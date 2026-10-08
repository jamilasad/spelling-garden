// Loads the word lists and the audio index.

export const data = {
  config: {},
  lists: [],
  words: [],
  byId: new Map(),
  audio: {},
};

async function getJson(url, fallback) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    return res.ok ? await res.json() : fallback;
  } catch {
    return fallback;
  }
}

export async function loadData() {
  const [config, lists, audio] = await Promise.all([
    getJson('data/app-config.json', {}),
    getJson('data/lists.json', []),
    getJson('data/audio-index.json', {}),
  ]);
  data.config = config;
  data.lists = lists;
  data.audio = audio;
  const perList = await Promise.all(lists.map((l) => getJson(l.file, [])));
  data.words = [];
  data.byId.clear();
  perList.forEach((words, i) => {
    const list = lists[i];
    words.forEach((w) => {
      const word = { ...w, word: w.word.normalize('NFC'), lang: list.lang, listId: list.id };
      data.words.push(word);
      data.byId.set(word.id, word);
    });
  });
}

export async function reloadAudioIndex() {
  data.audio = await getJson('data/audio-index.json', data.audio);
}

export const wordsOfList = (listId) => data.words.filter((w) => w.listId === listId);
export const wordsOfLang = (lang) => data.words.filter((w) => w.lang === lang);
export const listById = (id) => data.lists.find((l) => l.id === id);
export const languages = () => [...new Set(data.lists.map((l) => l.lang))];
