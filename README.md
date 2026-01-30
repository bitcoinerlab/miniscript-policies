# Miniscript Policies

This package provides the Miniscript policy compiler and analyzer based on the
reference C++ implementation, compiled to JavaScript with Emscripten.

Use this package when you need to compile policies into Miniscript expressions
for P2WSH or when you want the reference analyzer behavior.

## Usage

```javascript
import { compilePolicy, compileMiniscript, ready } from '@bitcoinerlab/miniscript-policies';

await ready;
const policy = 'or(and(pk(A),older(8640)),pk(B))';
const result = compilePolicy(policy);
console.log(result.miniscript, result.asm);
```

## Build

This package uses Emscripten. Build with:

```bash
make clean && make
```
