import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

export const getAuthorId = (): string => {
  let authorId = Cookies.get('authorId');
  if (!authorId) {
    authorId = `anon_${uuidv4()}`;
    Cookies.set('authorId', authorId, { expires: 365 });
  }
  return authorId;
}; 