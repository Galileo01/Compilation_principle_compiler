import graphviz
import sys
class Node:         #节点类，描述节点的编号，节点的值，节点相连节点
    def __init__(self, no, value) -> None:
        self.no = no
        self.value = value 
        self.friend = []

class NFA:          #NFA类，描述一个NFA的头节点和尾节点
    def __init__(self, head, tail) -> None:
        self.head = head
        self.tail = tail



class NF_NFA:       #正规式转NFA
    def __init__(self, NF) -> None:
        self.NormalForm = NF        #输入的正规式
        self.symbol_table = ['.', '*', '|', '(', ')']       #连接符号常量
        self.priority = {'|':0, '.':1, '*':2}               #连接符号优先级
        self.no = 0                 #节点编号
        self.nfaStack = []          #NFA栈，存放NFA
        self.symbolStack = []       #连接符栈

    def expand(self):
        i = 0
        while i < len(self.NormalForm):
            if self.NormalForm[i] not in self.symbol_table or self.NormalForm[i] in [')', '*']:
                if i + 1 < len(self.NormalForm):
                    if self.NormalForm[i+1] not in self.symbol_table or self.NormalForm[i+1] == '(':
                        self.NormalForm.insert(i+1, '.')
                        i += 1
            i += 1
        print(self.NormalForm)

    def NoAdd(self):                        #节点编号增加
        self.no += 1
        return self.no - 1

    def newNFAItem(self, value):            #创建新的NFA
        head = Node(self.NoAdd(), 'ε')
        tail = Node(self.NoAdd(), value)
        head.friend.append(tail)
        return NFA(head, tail)

    def And(self, nfa1, nfa2):                          #处理'.'符号，连接
        nfa1.tail.friend.append(nfa2.head)
        # print(nfa1.head.value, nfa2.tail.value)
        return NFA(nfa1.head, nfa2.tail)

    def Or(self, nfa1, nfa2):                           #处理'|'符号，或
        newHead = Node(self.NoAdd(), 'ε')
        newTail = Node(self.NoAdd(), 'ε')
        newHead.friend.append(nfa1.head)
        newHead.friend.append(nfa2.head)
        nfa1.tail.friend.append(newTail)
        nfa2.tail.friend.append(newTail)

        return NFA(newHead, newTail)

    def closure(self, nfa):                             #处理'*'符号，闭包
        newHead = Node(self.NoAdd(), 'ε')
        newTail = Node(self.NoAdd(), 'ε')
        
        newHead.friend.append(nfa.head)
        nfa.tail.friend.append(newTail)
        newHead.friend.append(newTail)
        nfa.tail.friend.append(nfa.head)

        return NFA(newHead, newTail)

    def dealApart(self):                                #对|和 . 进行分别处理
        newNFA = None
        ope = self.symbolStack.pop(-1)
        nfa2 = self.nfaStack.pop(-1)
        if ope == '|':
            nfa1 = self.nfaStack.pop(-1)
            newNFA = self.Or(nfa1, nfa2)
        elif ope == '.':
            nfa1 = self.nfaStack.pop(-1)
            newNFA = self.And(nfa1, nfa2)
        return newNFA

    def paint(self, path):                              #绘制NFA,
        painter = graphviz.Digraph(path+'/nfa', format='png')
        painter.attr(rankdir='LR')
        startNode = self.nfaStack[0].head
        endNode = self.nfaStack[0].tail
        # painter.attr('node', shape='point')
        # painter.node('start')
        # painter.attr('node', shape='circle')
        # painter.node(str(startNode.no))
        # painter.edge('start', str(startNode.no), label=startNode.value)

        paintStack = []
        paintStack.append(startNode)
        ban_repeat = set()
        ban_repeat.add(startNode.no)

        while len(paintStack) > 0:
            currentNode = paintStack.pop(-1)
            for node in currentNode.friend:
                if node.no not in ban_repeat:
                    paintStack.append(node)
                ban_repeat.add(node.no)
                if node.no == endNode.no:
                    painter.attr('node', shape='doublecircle')
                    painter.node(str(node.no))
                else:
                    painter.attr('node', shape='circle')
                    painter.node(str(node.no))
                painter.edge(str(currentNode.no), str(node.no), label=node.value)
        painter.view()

    def drawNFA(self): 
        self.expand()                                 #NFA绘制
        for n in self.NormalForm:
            if n in self.symbol_table:
                print(self.symbolStack, n, len(self.nfaStack))
                newNFA = None
                if n == ')':
                    while self.symbolStack[-1] != '(':
                        newNFA = self.dealApart()
                        self.nfaStack.append(newNFA)
                    self.symbolStack.pop(-1)
                else:
                    if n == '*':
                        newNFA = self.closure(self.nfaStack.pop(-1))
                        self.nfaStack.append(newNFA)
                        continue
                    if len(self.symbolStack) > 0:
                        if self.symbolStack[-1] != '(':
                            if n in self.priority:
                                while True:
                                    if len(self.symbolStack) > 0  and self.priority[n] <= self.priority[self.symbolStack[-1]]:
                                        newNFA = self.dealApart()
                                        self.nfaStack.append(newNFA)
                                    else:
                                        break
                    self.symbolStack.append(n)
            else:
                new = self.newNFAItem(n)
                self.nfaStack.append(new)
        while len(self.symbolStack) > 0:               #最后一个操作符处理
            newNFA = self.dealApart()
            if newNFA != None:
                self.nfaStack.append(newNFA)
        self.paint('/Users/bytedance/My/编译原理/compiler/src/views/NFADFA')

class NFA_DFA:          #NFA转为DFA
    def __init__(self, NF, NFA) -> None:
        self.NF = NF            
        self.NFA = NFA
        self.limitInputTable = []
        self.table = {}
        self.table_rename = {}
        self.row_count = 0
        self.row_value = []
        self.isFinal = {}
        self.division = []

    def getLimitTable(self):            #获取有穷输入列表
        print(self.NF)
        for n in self.NF:
            if n not in ['(', ')', '|', '*'] and n not in self.limitInputTable:
                self.limitInputTable.append(n)

    def expandNFA(self):                #在NFA头部和尾部加入节点
        lastNo = self.NFA.tail.no
        # newHead1 = Node(lastNo+1, 'ε')
        newHead1 = Node(lastNo+1, 'X')
        # newHead2 = Node(lastNo+3, 'ε')
        newTail2 = Node(lastNo+2, 'ε')
        newHead1.friend.append(self.NFA.head)
        self.NFA = NFA(newHead1, self.NFA.tail)

        self.NFA.tail.friend.append(newTail2)
        self.NFA = NFA(self.NFA.head, newTail2)

    def closure_ε(self, target):        #求空弧闭包
        result = []
        result.append(target)
        isChange = True
        stack = []
        stack.append(target)
        stackno = []
        stackno.append(target.no)
        while len(stack) > 0:
            top = stack.pop(-1)
            for t in top.friend:
                if t.value == 'ε' and t.no not in stackno:
                    stackno.append(t.no)
                    stack.append(t)
                    result.append(t)
        return result

    def move(self, row, arc):           #求move(I, a)
        moveResult = []
        moveResultNo = []
        for r in row:
            for f in r.friend:
                if f.value == arc and f.no not in moveResultNo:
                    moveResultNo.append(f.no)
                    moveResult.append(f)
        return moveResult

    def getFirstRow(self):              #获取第一行的I
        firstRow = self.closure_ε(self.NFA.head)
        return firstRow

    def judgeFinal(self):
        for row in self.table_rename:
            hasEndNode = False
            for i in self.row_value[row]:
                if i.no == self.NFA.tail.no:
                    hasEndNode = True
                    break
            if hasEndNode:
                self.isFinal[row] = True
            else:
                self.isFinal[row] = False

    def paint(self, path):
        painter = graphviz.Digraph(path+'/dfa', format='png')
        painter.attr(rankdir='LR')
        for row in self.table_rename:
            hasEndNode = self.isFinal[row]
            if hasEndNode:
                painter.attr('node', shape='doublecircle')
                painter.node(str(row), str(row))
            else:
                painter.attr('node', shape='circle')
                painter.node(str(row), str(row))

        for row in self.table_rename:
            for column in self.table_rename[row]:
                painter.edge(str(row), str(self.table_rename[row][column]), label=column)

        painter.view()

    def construct_table(self):          #维护状态转换表
        self.getLimitTable()
        self.expandNFA()

        print(self.limitInputTable)

        firstRow = self.getFirstRow()

        self.row_value.append(firstRow) 
        self.table[self.row_count] = {}
        self.row_count += 1

        isChange = True
        while isChange:                 #当表中信息不再改变时
            isChange = False
            tempRV = self.row_value.copy()
            for i in range(len(tempRV)):
                for arc in self.limitInputTable:
                    if arc not in self.table[i]:
                        self.table[i][arc] = []
                    ###获取move(I, a)
                    moveResult = self.move(tempRV[i], arc)
                    ###获取closure_ε
                    for m in moveResult:
                        closure = self.closure_ε(m)
                        for c in closure:
                            if c not in self.table[i][arc]:
                                self.table[i][arc].append(c)
                    temp = self.table[i][arc].copy()
                    if len(temp) > 0:
                        if temp not in self.row_value:
                            self.row_value.append(temp)
                            self.table[self.row_count] = {}
                            self.row_count += 1
                            isChange = True
        for row in self.table:
            self.table_rename[row] = {}
            for column in self.table[row]:
                for j,r in enumerate(self.row_value):
                    if r == list(self.table[row][column]):
                        self.table_rename[row][column] = j
                        break
        print(self.table_rename)
        self.judgeFinal()
        self.paint('/Users/bytedance/My/编译原理/compiler/src/views/NFADFA')

    def paintSDFA(self, address):               #绘制最小化的DFA
        painter = graphviz.Digraph(address+'/sdfa', format='png')
        painter.attr(rankdir='LR')
        for d in self.division:
            if self.isFinal[d[0]]:
                painter.attr('node', shape='doublecircle')
                painter.node(str(d[0]), str(d[0]))
            else:
                painter.attr('node', shape='circle')
                painter.node(str(d[0]), str(d[0]))
        for d in self.division:
            tr = {}
            for l in self.limitInputTable:
                if l in self.table_rename[d[0]]:
                    tresult = self.table_rename[d[0]][l]
                    if [tresult] in self.division:
                        if tresult not in tr:
                            tr[tresult] = l
                        else:
                            tr[tresult] += ','+l
            for t in tr:
                painter.edge(str(d[0]), str(t), label=tr[t])
        painter.view()
           
    def simplifyDFA(self):          #DFA最小化
        final = []              #初始化非终态集
        unfinal = []            #初始化终态集
        for row in self.isFinal:
            if self.isFinal[row]:
                final.append(row)
            else:
                unfinal.append(row)
        self.division.append(final)
        self.division.append(unfinal)

        isChange = True
        while isChange:         #DFA状态不再改变时，停止循环
            isChange = False
            tempDivision = self.division.copy()         #浅复制
            tempStore = []
            print(tempDivision)
            for divItem in tempDivision:
                tempDivStore = []
                if len(divItem) == 1:                   #当子集长度为一时，不再划分
                    tempStore.extend([divItem])
                    continue
                for limit in self.limitInputTable:      #当子集长度大于一时，继续判断
                    tryDiv = []                    #尝试划分列表
                    trRecord = {}                  #记录相同状态
                    for div in divItem:        
                        if limit in self.table_rename[div]:
                            tr = self.table_rename[div][limit]
                            if tr not in trRecord:
                                trRecord[tr] = []
                            trRecord[tr].append(div)
                        else:
                            if 'null' not in trRecord:
                                trRecord['null'] = []
                            trRecord['null'].append(div)
                    for key in trRecord:
                        if key != 'null':
                            temp = []
                            for t in trRecord[key]:
                                temp.append(t)
                            tryDiv.append(temp)
                        else:
                            for t in trRecord[key]:
                                tryDiv.append([t])
                    if len(tryDiv) > 1:             #如果得到的状态数大于一，则说明当前子集可再划分，退出当前循环
                        tempStore.extend(tryDiv)
                        tempDivStore.clear()
                        isChange = True
                        break
                    if len(tempDivStore) == 0:      #当前转换符时，不可再分
                        tempDivStore = tryDiv.copy()
                if len(tempDivStore) > 0:           #遍历完所有转换符，都不可再分
                    tempStore.extend(tryDiv)
            self.division.clear()               #浅复制
            self.division = tempStore.copy()
            tempStore.clear()
        for i in range(len(self.division)):
            if len(self.division[i]) > 1:
                for t in self.table_rename:
                    for j in self.table_rename[t]:
                        if self.table_rename[t][j] in self.division[i]:
                            self.table_rename[t][j] = self.division[i][0]
            self.division[i] = [self.division[i][0]]
        print(self.division)
        self.paintSDFA('/Users/bytedance/My/编译原理/compiler/src/views/NFADFA')
                        

if __name__ == '__main__':
    # nfs = '(ab)*(a*|b*)a|b*(ba)*|aa*'
    nfs=sys.argv[1]
    nf = list(nfs)
    demoNFA = NF_NFA(nf)
    demoNFA.expand()
    demoNFA.drawNFA()
    demoDFA = NFA_DFA(list(nfs), demoNFA.nfaStack[0])
    demoDFA.construct_table()
    demoDFA.simplifyDFA()