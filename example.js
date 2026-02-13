// To run it: "node ./example.js"

const { compilePolicy, compilePolicyTaproot, ready } = require("./dist/index.js");

(async () => {
  await ready;

  const p2wshPolicy = "or(and(pk(A),older(8640)),pk(B))";
  const taprootPolicy =
    "or(and(thresh(2,pk(A),pk(B),pk(C)),and(thresh(2,pk(D),sha256(H),older(144)),after(700000))),and(pk(E),hash160(H)))";

  const p2wsh = compilePolicy(p2wshPolicy);
  const taproot = compilePolicyTaproot(taprootPolicy);

  if (!p2wsh.issane) {
    console.warn("Policy result is not sane for P2WSH:", p2wsh.miniscript);
  } else {
    console.log({
      policy: p2wshPolicy,
      miniscript: p2wsh.miniscript,
      asm: p2wsh.asm,
      issane: p2wsh.issane,
    });
  }

  if (!taproot.issane) {
    console.warn("Policy result is not sane for tapscript:", taproot.miniscript);
  } else {
    console.log({
      policy: taprootPolicy,
      taprootMiniscript: taproot.miniscript,
      hasMultiA: taproot.miniscript.includes("multi_a("),
      hasNestedThresh: taproot.miniscript.includes("thresh(")
    });
  }

})();
