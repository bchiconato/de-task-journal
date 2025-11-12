/**
 * @fileoverview Confluence service main exports
 * @module services/confluence
 */

export {
  searchConfluencePages,
  listConfluencePages,
  listConfluenceSpaces,
} from './search.js';

export {
  appendToConfluencePage,
  overwriteConfluencePage,
  checkConfluencePageAccess,
} from './client.js';

export { markdownToConfluenceStorage } from './markdown.js';
