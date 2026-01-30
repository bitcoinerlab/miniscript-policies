export declare const compilePolicy: (miniscript: string) => {
  miniscript: string;
  asm: string;
  issane: boolean;
  issanesublevel: boolean;
};

export declare const compileMiniscript: (miniscript: string) => {
  asm: string;
  issane: boolean;
  issanesublevel: boolean;
};

export declare const ready: Promise<void>;
