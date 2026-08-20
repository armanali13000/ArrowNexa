import { CHAPTERS, LEVELS_PER_CHAPTER, TOTAL_CHAPTERS } from '../../constants/progression';

export type ChapterInfo = {
  chapter: number;
  name: string;
  startLevel: number;
  endLevel: number;
  isFinale: (levelNumber: number) => boolean;
};

export const getChapterForLevel = (levelNumber: number): ChapterInfo => {
  const chapter = Math.max(1, Math.min(TOTAL_CHAPTERS, Math.ceil(levelNumber / LEVELS_PER_CHAPTER)));
  const startLevel = (chapter - 1) * LEVELS_PER_CHAPTER + 1;
  const endLevel = chapter * LEVELS_PER_CHAPTER;
  return {
    chapter,
    name: CHAPTERS[chapter - 1],
    startLevel,
    endLevel,
    isFinale: (candidate) => candidate === endLevel,
  };
};

export const getChapters = () => Array.from({ length: TOTAL_CHAPTERS }, (_, index) => getChapterForLevel(index * LEVELS_PER_CHAPTER + 1));
