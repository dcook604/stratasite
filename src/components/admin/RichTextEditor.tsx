import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/**
 * Thin wrapper around react-quill.
 *
 * Deliberately isolated in its own module so it can be loaded with React.lazy —
 * the editor (and its CSS) is only needed when an admin is editing, so keeping
 * it out of the eagerly-loaded routes keeps Quill out of the main bundle.
 */
export default function RichTextEditor(props: React.ComponentProps<typeof ReactQuill>) {
  return <ReactQuill {...props} />;
}
