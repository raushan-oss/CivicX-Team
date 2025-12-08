testcase=int(input())
for _ in range(testcase):
    totalcows , mycowindx = map(int,input().split())
    rating=list(map(int, input().split()))
    flag=1
    for i in range(mycowindx):
        if rating[i]>rating[mycowindx-1]:
            win=i-1
            rating[i],rating[mycowindx-1]=rating[mycowindx-1],rating[i]
            flag=0
            break
    if flag==1:
        c=0
        j=mycowindx
        while j<len(rating) and rating[j]<rating[mycowindx-1]  :
            j+=1
            c+=1
        print (mycowindx-1+c)
    else:
        if i==0:
            c=0
            j=i+1
            while j<len(rating) and  rating[j]<rating[i] :
                j+=1
                c+=1
            print (c)
        else:
            c=0
            j=i+1
            while j<len(rating) and  rating[j]<rating[i] :
                j+=1
                c+=1
            print (max((c+1),win))


