"""Minimal reviewed learning-preview content. Full curriculum arrives in Phase 4."""

LESSONS = [
    {
        "id": "python-hello",
        "language": "Python",
        "title": "Your First Python Program",
        "level": "Beginner",
        "duration_minutes": 4,
        "description": "Learn what print() does and how Python statements work.",
        "code": 'print("Hello, Syntax-Sensei!")',
        "explanation": [
            "print() is a built-in Python function that displays information.",
            "Text in quotation marks is a string: a sequence of characters.",
            "Parentheses surround the argument passed into the function.",
            "When you run this line, the message appears in the terminal."
        ],
        "expected_output": "Hello, Syntax-Sensei!"
    },
    {
        "id": "python-variables",
        "language": "Python",
        "title": "Variables and Values",
        "level": "Beginner",
        "duration_minutes": 5,
        "description": "Store information using variable names.",
        "code": 'language = "Python"\nlevel = 1\nprint(language, level)',
        "explanation": [
            "The = symbol assigns a value to a variable name.",
            "language refers to a string; level refers to an integer.",
            "Variables let you reuse information instead of repeating it.",
            "print() can display several values separated by commas."
        ],
        "expected_output": "Python 1"
    },
    {
        "id": "python-conditions",
        "language": "Python",
        "title": "Your First Condition",
        "level": "Beginner",
        "duration_minutes": 6,
        "description": "Make decisions using if and indentation.",
        "code": 'score = 85\nif score >= 60:\n    print("Passed")',
        "explanation": [
            "if checks whether a condition is true.",
            ">= means greater than or equal to.",
            "The colon begins a new indented block of code.",
            "Indented statements only run when the condition is true."
        ],
        "expected_output": "Passed"
    }
]

LESSON_IDS = {lesson["id"] for lesson in LESSONS}
