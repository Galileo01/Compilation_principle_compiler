import getGrammar, json
class First:
    def __init__(self, grammar) -> None:
        self.firsts = dict()
        self.firstRelation = dict()
        self.firstsResource = dict()
        # self.nonterminator = nt
        self.grammar = grammar
        # self.terminator = t

    def dicInit(self):  #初始化first字典
        for n in self.grammar:
            self.firsts[n] = []
            self.firstsResource[n] = dict()
        for g in self.grammar:
            self.firstRelation[g] = []
            # for can in self.grammar[g]:
            #     temp = []
            #     self.firstRelation[g][''.join(can)] = temp

    def intoFile(self, filename):
        with open(filename, 'w') as f:
            json.dump(self.firsts, f)

    def rule34(self, gc, grammar):     #对first集规则3,4进行判断和处理
        hasNull = False
        if gc not in self.grammar:
            return False
        else:
            for nont in grammar[gc]:
                if 'ε' in nont:
                    hasNull = True
                    break
            return hasNull

    def getFirst(self):
        self.dicInit()
        # print(self.grammar)
        for g in self.grammar:   #第一次遍历候选式列表
            for gr in self.grammar[g]:
                # print(g, gr)
                if gr[0] not in self.grammar:    #如果候选式第一个字符是终结符，则直接加入到First集中
                    if gr[0] not in self.firsts[g]:
                        self.firsts[g].append(gr[0])
                    if gr[0] not in self.firstsResource[g]:
                        self.firstsResource[g][gr[0]] = []
                    self.firstsResource[g][gr[0]].append(gr) 
                elif gr[0] == 'ε':      #如果候选式第一个字符是空字符，则直接加入到First集中
                    if gr[0] not in self.firsts[g]:
                        self.firsts[g].append(gr[0])
                    if gr[0] not in self.firstsResource[g]:
                        self.firstsResource[g][gr[0]] = []
                    self.firstsResource[g][gr[0]].append(gr) 
                elif gr[0] in self.grammar:   #如果候选式第一个字符是非终结符，则进入相应函数进行下一步处理
                    temp = []
                    for ins in gr:
                        if ins in self.grammar and ins not in temp:
                            # print(ins)
                            temp.append(ins)
                            if ins not in self.firstsResource[g]:
                                self.firstsResource[g][ins] = []
                            self.firstsResource[g][ins].append(gr)
                            # self.firstsResource[g][ins] = gr
                        # else:
                        #     break
                    self.firstRelation[g].append(temp)
                        
        while True:
            isChanged = False
            for r in self.grammar:  #遍历产生式链表，对于每一个非终结符，去遍历其与first集相关的关系链表 
                if r in self.grammar:
                    for can in range(len(self.firstRelation[r])):
                        flag = True     #标记是否需要舍弃
                        abandon = len(self.firstRelation[r][can])
                        if abandon == 0:
                            flag = False
                        for i, fr in enumerate(self.firstRelation[r][can]):    #遍历对应的关系列表
                            if not self.rule34(fr, self.grammar):    #如果第Xi个非终结符中没有ε或者当前的Xi是终结符
                                # print('access')
                                abandon = i 
                                flag = False
                                break     #则停止查找，将后面的元素全部舍去。
                        if not flag:
                            temp = self.firstRelation[r][can][:abandon+1]
                            self.firstRelation[r][can].clear()
                            self.firstRelation[r][can] = temp
                        else:
                            if 'ε' not in self.firsts[r]:
                                self.firsts[r].append('ε')
                        # print(self.firstRelation[r][can])
            for r in self.grammar:   #遍历产生式链表，对于每一个非终结符，去遍历其与first集相关的关系链表 
                # print(r, self.firstRelation[r])
                if r in self.grammar:
                    for can in self.firstRelation[r]:
                        # print(can)
                        for fr in can:    #遍历对应的关系列表
                            tresourse = []
                            if fr in self.firstsResource[r]:    #
                                tresourse = self.firstsResource[r][fr]
                            for notnull in self.firsts[fr]:     #如果FIRST(Xi)中有元素，则把FIRST(Xi)中非ε元素以及FIRST(A)中没有的元素加入到FIRST(A)中；
                                if notnull != 'ε':
                                    if notnull not in self.firsts[r]:
                                        self.firsts[r].append(notnull)
                                        isChanged = True
                                if len(tresourse)>0:
                                    if notnull not in self.firstsResource[r]:
                                        self.firstsResource[r][notnull] = []
                                    for fre in tresourse:
                                        if fre not in self.firstsResource[r][notnull]:
                                            self.firstsResource[r][notnull].append(fre)
                            if len(self.firstRelation[fr])!=0:     #如果Xi的关系链表不为空，则把他关系链表中没有在A的关系链表中出现的接点插入到A的关系链表中。
                                for tcan in self.firstRelation[fr]:
                                    for node in tcan:
                                        if node not in can:
                                            can.append(node)
                                            if node not in self.firstsResource[r]:
                                                self.firstsResource[r][node] = []
                                            for ntre in tresourse:
                                                self.firstsResource[r][node].append(ntre)
            if not isChanged:
                break
            # count += 1
        # print(self.firsts)
        # print(self.firstsResource)
        # self.intoFile('giao.json')
        return self.firsts
    def getFirstResourse(self):
        return self.firstsResource
        

    

class Follow:
    def __init__(self, grammar, firsts) -> None:
        self.follows = dict()
        self.followRelation = dict()
        self.grammar = grammar
        self.firsts = firsts

    def dicInit(self):  #初始化first字典
        for n in self.grammar:
            self.follows[n] = []
        for g in self.grammar:
            self.followRelation[g] = []
        
    def rule34(self, src, values):
        for v in values:
            # print(v)
            for f in self.firsts[v]:
                if f not in self.follows[src] and f != 'ε':
                    self.follows[src].append(f)

    def allNull(self, values):
        for v in values:
            # print(v)
            if 'ε' not in self.firsts[v] or v not in self.grammar:
                return False
        return True

    def getFollow(self):
        self.dicInit()
        for g in self.grammar:
            self.follows[g].append('#')
            break
        for g in self.grammar:   #第一次遍历候选式列表
            for gr in self.grammar[g]:
                for e in range(len(gr)):
                    if gr[e] in self.grammar:       #如果产生式中有非终结符
                        if e+1 < len(gr):       #且该非终结符不在末尾
                            if gr[e+1] not in self.grammar and gr[e+1] not in self.follows[gr[e]]:      #如果下一个字符是终结符，则符合规则2
                                self.follows[gr[e]].append(gr[e+1])
                                # print(gr[e], gr[e+1])
                            elif gr[e+1] in self.grammar:    #如果下一个字符是终结符，则会符合规则3、4
                                temp = gr[e+1:]     #将产生式当前位置开始的字段截取出来
                                # print(gr[e], gr[e+1], temp)
                                if self.allNull(temp):      #判断截取的字段中是否所有的非终结符都能直接或者间接推导出空字符，如果能，则符合规则4
                                    if g not in self.followRelation[gr[e]]:
                                        self.followRelation[gr[e]].append(g)
                                self.rule34(gr[e], temp)
                        else:   #如果该终结符位于末尾，则符合规则4
                            if g not in self.followRelation[gr[e]]:
                                self.followRelation[gr[e]].append(g)
        while True:
            isChanged = False
            for g in self.grammar:      #遍历产生式中的非终结符
                for fre in self.followRelation[g]:      #遍历对应的候选式
                    for notnull in self.follows[fre]:    #
                        if notnull not in self.follows[g]:
                            self.follows[g].append(notnull)
                            isChanged = True
                    for fore in self.followRelation[fre]:
                        if fore not in self.followRelation[g]:
                            self.followRelation[g].append(fore)
            if not isChanged:
                break
        # print(self.follows)
        return self.follows



if __name__ == '__main__':
    # grammarCon = getGrammar.getGrammar('D:\学习\大三下\编译原理\\exp2\\语法规则.txt')
    grammarCon = getGrammar.getGrammar('D:\学习\大三下\编译原理\文法\\norecirsion_gramma.txt')
    grammar = grammarCon.getContent()
    # grammar = grammarCon.getContent('D:\\学习\\大三下\\编译原理\\exp2\\testParam.txt')
    # t = ['i', 'ε', '(', ')', '+', '*']
    # t = ['#','空','+','-','*','/','%','(',')',',','>','<','=','!','&&','||','const','int','char','float',';','void','else','for','while','do', 'if','{','}','break','continue','return', '标识符','数值型常量','字符型常量','']
    demo = First(grammar)
    demo.getFirst()