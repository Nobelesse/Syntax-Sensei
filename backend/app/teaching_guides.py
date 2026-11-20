"""Small reviewed, offline reference guides for foundational topic coverage.

These are not a substitute for broad curriculum or a guarantee that an LLM answer
covers every detail. They provide a dependable fallback for known overview topics.
"""
from __future__ import annotations
import re

PYTHON_OPERATOR_FAMILIES = (
    "Arithmetic", "Comparison", "Assignment", "Logical", "Bitwise", "Membership", "Identity"
)

PYTHON_OPERATOR_GUIDE = """# Python Operators — Complete Beginner's Study Guide

An **operator** is a symbol or keyword that performs an operation on one or more values (called *operands*). In introductory Python, operators are commonly organized into **seven main families**. Some courses call comparison operators *relational operators*.

| Family | Main operators | What it does |
|---|---|---|
| **1. Arithmetic** | `+`, `-`, `*`, `/`, `//`, `%`, `**`, `@` | Calculations; `@` is matrix multiplication for types that support it |
| **2. Comparison (relational)** | `==`, `!=`, `>`, `<`, `>=`, `<=` | Compare values; usually produce `True` or `False` |
| **3. Assignment** | `=`, `+=`, `-=`, `*=`, `/=`, `//=`, `%=`, `**=`, `&=`, `|=`, `^=`, `>>=`, `<<=`, `@=` | Bind or update variables |
| **4. Logical** | `and`, `or`, `not` | Combine or negate conditions |
| **5. Bitwise** | `&`, `|`, `^`, `~`, `<<`, `>>` | Work with individual bits of integers |
| **6. Membership** | `in`, `not in` | Check whether a value belongs to a collection |
| **7. Identity** | `is`, `is not` | Check whether two references point to the same object |

## 1. Arithmetic operators

```python
x, y = 10, 3
print(x + y)   # 13
print(x / y)   # 3.333...
print(x // y)  # 3 (floor division)
print(x % y)   # 1 (remainder)
print(x ** y)  # 1000 (power)
```

`/` produces true division; `//` rounds down (toward negative infinity), so `-10 // 3` is `-4`. Dividing by zero raises `ZeroDivisionError`. Unary `+` and `-` also work with numbers. `@` is intended for matrix multiplication and is not supported for ordinary scalar numbers.

## 2. Comparison operators

```python
age = 18
print(age >= 18)  # True
print(age == 21)  # False
print(age != 21)  # True
```

`=` assigns; `==` tests equality. Python also supports chained comparisons such as `1 < age < 100`.

## 3. Assignment operators

```python
score = 10
score += 5        # score becomes 15
score *= 2        # score becomes 30
```

The *assignment expression* operator `:=` (often called the walrus operator) can bind a value inside an expression, such as `if (n := len(items)) > 0:`. It is different from ordinary `=` assignment.

## 4. Logical operators

```python
age, has_id = 20, True
print(age >= 18 and has_id)  # True
print(not has_id)            # False
```

`and` and `or` **short-circuit**: Python may skip evaluating the right-hand side. They return an operand, which is not always literally `True` or `False`; for example, `0 or 5` evaluates to `5`.

## 5. Bitwise operators

```python
print(5 & 3)   # 1  (0101 AND 0011)
print(5 | 3)   # 7
print(5 ^ 3)   # 6
print(5 << 1)  # 10
```

`~` performs bitwise inversion; for ordinary Python integers, `~5` evaluates to `-6`.

## 6. Membership operators

```python
print('p' in 'python')            # True
print(7 not in [1, 2, 3])         # True
print('name' in {'name': 'Sam'})  # True (dictionary checks keys)
```

## 7. Identity operators

```python
first = [1, 2]
second = [1, 2]
print(first == second)  # True: same contents
print(first is second)  # False: different list objects
```

Use `is None` (not `== None`) when testing for `None`. Don't use `is` to compare whether two strings or numbers have the same value.

## Operator precedence and mistakes to avoid

- Parentheses make evaluation order explicit: `(2 + 3) * 4` is `20`, while `2 + 3 * 4` is `14`.
- `**` binds more tightly than multiplication; logical `not`, `and`, and `or` have different precedence (`not` before `and` before `or`).
- Avoid confusing `=` with `==`, `is` with `==`, or bitwise `&` with logical `and`.
- Many operators have additional uses: `+` concatenates some sequences, and `*` repeats some sequences.

## Check your understanding

1. What is the difference between `/` and `//`?
2. Why might `a == b` be true while `a is b` is false?
3. Which operator tests whether an item is in a list?

**Quick answers:** (1) true division versus floor division; (2) equal values can be different objects; (3) `in`.

**Related topics to study next:** expressions, data types, truthiness, conditional statements, operator precedence, sequence membership, and bit manipulation.
"""


def wants_python_operator_overview(prompt: str, language: str, mode: str) -> bool:
    """Match broad requests, not focused questions about individual operators."""
    if mode != "chat":
        return False
    question = prompt.lower().strip()
    if not re.search(r"\boperators?\b", question):
        return False
    if not (re.search(r"\bpython\b", question) or language.strip().lower() in {"python", "py"}):
        return False
    if re.search(r"\b(?:arithmetic|comparison|relational|assignment|logical|bitwise|membership|identity)\s+operators?\b", question):
        return False
    broad = re.search(r"\b(types?|kinds?|categories|all|different|overview|list|explain|teach|complete)\b", question)
    return bool(broad or re.search(r"\boperators?\s+in\s+python\b", question))


def ensure_operator_coverage(answer: str, prompt: str, language: str, mode: str) -> str:
    """Return the local full reference when an AI overview omits major families."""
    if not wants_python_operator_overview(prompt, language, mode):
        return answer
    lower = answer.lower()
    # LLMs may use the word 'relational' rather than 'comparison'.
    families = ("arithmetic", ("comparison", "relational"), "assignment", "logical", "bitwise", "membership", "identity")
    complete = all(any(word in lower for word in entry) if isinstance(entry, tuple) else entry in lower for entry in families)
    # Naming all seven is not the same as teaching them; short overviews get
    # the reviewed local study guide instead of an incomplete AI outline.
    return answer if complete and len(answer.strip()) >= 1200 else PYTHON_OPERATOR_GUIDE
