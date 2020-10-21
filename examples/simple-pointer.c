int a = 10; // declare an integer (2 bytes)
int b = 20; // declare another integer

int *p = NULL; // points to nothing
p = &a;        // p points to a
p = &b;        // p points to b
*p = 21;       // updates what p points to (b)
