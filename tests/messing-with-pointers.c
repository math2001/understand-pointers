int a = 10;
int *p1 = NULL;
int *p2 = NULL;
int *p3_with_long_name = NULL;
int **p4 = &p3_with_long_name;
int **p5 = &p1;

p1 = &a;
p2 = &a;
p3_with_long_name = &a;