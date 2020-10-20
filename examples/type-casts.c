int a = 10;
int *p = NULL;

p = &a;
*p = 20;
// type casts don't work yet
p = (int *)10;