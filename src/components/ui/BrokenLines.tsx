import type { ReactNode } from 'react';

type Props = {
  /** Cada string vira uma linha (`whitespace-nowrap` + `<br />`). */
  lines: readonly string[];
  /** Conteúdo da última linha (ex.: palavra isolada sem nowrap). */
  lastLine?: ReactNode;
};

/**
 * Quebra tipográfica controlada — prática do login Nexo:
 * define exatamente onde a frase quebra, sem depender da largura do container.
 */
export function BrokenLines({ lines, lastLine }: Props) {
  const body = lines.map((line, index) => (
    <span key={`${index}-${line}`}>
      {index > 0 ? <br /> : null}
      <span className="whitespace-nowrap">{line}</span>
    </span>
  ));

  if (lastLine === undefined) {
    return <>{body}</>;
  }

  return (
    <>
      {body}
      <br />
      {lastLine}
    </>
  );
}
