import { Fragment, type ReactNode } from "react";

/** Rendu Markdown minimal et sûr (pas de HTML brut) pour le contenu des leçons. */
function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) parts.push(<strong key={i++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) parts.push(<code key={i++}>{t.slice(1, -1)}</code>);
    else parts.push(<em key={i++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const lines = source.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(<h3 key={k++}>{inline(line.slice(4))}</h3>);
      i++;
    } else if (line.startsWith("## ")) {
      blocks.push(<h2 key={k++}>{inline(line.slice(3))}</h2>);
      i++;
    } else if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) items.push(lines[i++].slice(2));
      blocks.push(
        <ul key={k++}>
          {items.map((it, j) => (
            <li key={j}>{inline(it)}</li>
          ))}
        </ul>,
      );
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) items.push(lines[i++].replace(/^\d+\. /, ""));
      blocks.push(
        <ol key={k++}>
          {items.map((it, j) => (
            <li key={j}>{inline(it)}</li>
          ))}
        </ol>,
      );
    } else if (line.startsWith("> ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) items.push(lines[i++].slice(2));
      blocks.push(
        <blockquote key={k++}>
          {items.map((it, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {inline(it)}
            </Fragment>
          ))}
        </blockquote>,
      );
    } else {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^(#{2,3} |[-*] |\d+\. |> )/.test(lines[i])) items.push(lines[i++]);
      blocks.push(<p key={k++}>{inline(items.join(" "))}</p>);
    }
  }
  return <div className={className ?? "lesson-prose"}>{blocks}</div>;
}
