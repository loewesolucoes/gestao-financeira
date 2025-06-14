import { marked } from "marked";
import DOMPurify from "dompurify";

export class MarkdownUtils {
  public static render(text: string): string {
    if (!text) {
      return '';
    }

    return DOMPurify.sanitize(marked.parse(text, { async: false }));
  }
}