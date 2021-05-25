import sys
# sys.path.append('D:\学习\大三下\编译原理\\courseDesign\\grammar_ana')
# import LRtable, getGrammar, SLRtable, LR1table, DFA_LR1, firstAndfollow
class LR:
    def __init__(self, target, table, grammar) -> None:
        self.charStack = []
        self.statusStack = []
        self.target = target
        self.table = table
        self.grammar = grammar
        self.GeNo = []
        self.gTree = []
        self.nodeId = 0
        self.nodeValue = []
        self.nodeRelation = []
        self.nodeVisited = []

    def init(self):
        for g in self.grammar:
            for t in self.grammar[g]:
                self.GeNo.append([g, t])

    def startAnalyse(self):
        self.init()         #初始化产生式序号
        self.charStack.append('#')      #符号栈栈底添加‘#’
        self.statusStack.append(0)      #状态栈栈底添加状态0
        isError = False                 #错误标记
        while True:
            statusTop = self.statusStack[-1]        #状态栈栈顶元素出栈
            tarTop = self.target[0]         
            # print(self.statusStack, self.charStack, self.target)
            if tarTop not in self.table[statusTop]:         #表中对应位置为空，则报错
                isError = True
                break
            else:
                if isinstance(self.table[statusTop][tarTop], int):          #表中对应位置是数字，即将对应的状态压栈
                    self.charStack.append(self.target.pop(0))               #符号栈栈顶元素出栈
                    self.statusStack.append(self.table[statusTop][tarTop])          #
                    # print(self.iv[self.table[statusTop][tarTop]]) 
                elif isinstance(self.table[statusTop][tarTop], str):        #表中对应位置是字符串，可能是规约或者接受
                    if self.table[statusTop][tarTop] == 'acc':
                        break
                    else:
                        geno = int(self.table[statusTop][tarTop][1:])       #是规约，获取规约的产生式编号
                        length = len(self.GeNo[geno][1])                    #规约产生式的长度
                        statute = self.GeNo[geno][0]                        #规约的产生式左部


                        # self.gTree.insert(0, [statute, self.GeNo[geno][1]])
                        tre = []
                        if len(self.nodeValue) == 0:
                            currentId = self.nodeId
                            self.nodeValue.append(statute)
                            self.nodeVisited.append(0)
                            self.nodeRelation.append([])
                            self.nodeId += 1
                            for t in self.GeNo[geno][1]:
                                tre.append(self.nodeId)
                                self.nodeValue.append(t)
                                self.nodeVisited.append(1)
                                self.nodeId += 1
                                self.nodeRelation.append([])
                            self.nodeRelation[currentId] = tre.copy()
                        else:
                            startId = self.nodeId
                            self.nodeValue.append(statute)
                            self.nodeVisited.append(0)
                            self.nodeRelation.append([])
                            self.nodeId += 1
                            for t in self.GeNo[geno][1]:
                                isExist = False
                                # for i in range(startId-1, -1, -1):
                                for i in range(startId):
                                    if t == self.nodeValue[i] and self.nodeVisited[i] == 0:
                                        self.nodeRelation[startId].append(i)
                                        self.nodeVisited[i] = 1
                                        isExist = True
                                        break
                                if not isExist:
                                    self.nodeValue.append(t)
                                    self.nodeVisited.append(1)
                                    self.nodeRelation[startId].append(self.nodeId)
                                    self.nodeRelation.append([])
                                    self.nodeId += 1

                        # print(statute, self.GeNo[geno][1], length)
                        for i in range(length):                             #出栈对应长度数量的元素
                            self.statusStack.pop(-1)
                            self.charStack.pop(-1)
                        self.charStack.append(statute)                      #将规约后的非终结符压栈
                        if statute not in self.table[self.statusStack[-1]]:
                            isError = True
                            break
                        else:
                            self.statusStack.append(int(self.table[self.statusStack[-1]][statute][2:]))             #将状态压栈
        if isError:
            print('wrong!')
        else:
            return self.nodeValue, self.nodeRelation
            # print('accept!')
        # print(self.gTree)
        

if __name__ == '__main__':

    # tar = 'if ( id < num_coust ) { int id = id + id * id ; } else { int id = id ; } #'
    tar = 'if ( id < num_const ) { int id ; id = num_const ; } #'
    target = tar.split()
    grammarCon = getGrammar.getGrammar('D:\学习\大三下\编译原理\\文法\\LR_1_tang.txt')
    grammar = grammarCon.getContent()
    # dfa = DFA.DFA(grammar)
    # iv, rela = dfa.start()
    # tab = LRtable.LRtable(rela, iv, grammar)      #LR(0)
    # table = tab.construct()
    # tab = SLRtable.SLRtable(rela, iv, grammar)      #SLR(0)
    # table = tab.construct()
    first = firstAndfollow.First(grammar)
    dfa = DFA_LR1.DFA_LR1(grammar, first.getFirst())
    tab = LR1table.LR1table(grammar)      #LR(1)
    table = tab.construct()
    lr = LR(target, table, grammar)
    lr.startAnalyse()
    # first = firstAndfollow.First(grammar)
    # tab = LR1table.LR1table(grammar)      #LR(1)
    # table = tab.construct()
    # demo = LR(target, table, grammar)
    # demo.startAnalyse()

    

