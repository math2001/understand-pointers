int a = 10;
int b = 20;
int *p = &a;   // pointer that points to a
int **pp = &p; // pointer that points to a pointer

*pp = &b;  // change the value of p
**pp = 21; // change the value b