export declare const compilePolicy: (policy: string) => {
  miniscript: string;
  asm: string;
  issane: boolean;
  issanesublevel: boolean;
};

export type CompilePolicyTaprootResult = {
  miniscript: string;
  issane: boolean;
};

export declare const compilePolicyTaproot: (
  policy: string
) => CompilePolicyTaprootResult;

export declare const ready: Promise<void>;
