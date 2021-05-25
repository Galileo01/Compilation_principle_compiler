from graphviz import Digraph
import sys
# sys.path.append('D:\学习\大三下\编译原理\\courseDesign\\grammar_ana\\LR')
# sys.path.append('D:\学习\大三下\编译原理\\courseDesign\\grammar_ana')
# sys.path.append('D:\学习\大三下\编译原理\\courseDesign\\semantic_ana')
import DFA_LR1, LR1table, LRControl, getGrammar, firstAndfollow

address = '/Users/bytedance/My/编译原理/compiler/src/views/LRAnalyseModal/LR'

class treeDraw:
    def __init__(self, nodeValue, nodeRelation, grammar, method) -> None:
        self.nodeValue = nodeValue
        self.nodeRelation = nodeRelation
        self.grammar = grammar
        self.method = method
        self.graph = Digraph('G', filename=address+method, format='png')


    def draw(self):
        stack = []
        if self.method == 'lr':
            self.graph.node(str(len(self.nodeValue)-1), label=self.nodeValue[-1])
            stack.append(len(self.nodeValue)-1)       #将树的根节点加入栈
        else:
            self.graph.node(str(0), label=self.nodeValue[0])
            stack.append(0)
        count = 0
        # while count < 25:
        while len(stack) > 0:
            # restack = stack.copy()
            root = stack.pop(-1)
            # print(root, self.nodeValue[root], self.nodeRelation[root])
            if len(self.nodeRelation[root]) > 0:
                for childnode in (self.nodeRelation[root]):      #遍历树中节点的子节点
                    stack.append(childnode)
                    self.graph.node(str(childnode), label=self.nodeValue[childnode])
                    self.graph.edge(str(root), str(childnode))
            # count += 1
        # print(self.nodeValue)
        # print(self.nodeRelation)
        self.graph.view()
        self.trans()
    def trans(self):
        target = ''
        for i,n in enumerate(self.nodeValue):
            if len(self.nodeRelation[i]) > 0:
                temp = self.nodeValue[i].ljust(20)
                temp +=  '->'.center(14)
                tt = ''
                for r in self.nodeRelation[i]:
                    # temp += '\t' 
                    tt += self.nodeValue[r]
                    tt += ' '
                temp += tt.ljust(20)
                target += temp
                target += '\n'
        print(target)

if __name__ == '__main__':
    tar = 'if ( id < num_const ) { int id ; id = num_const ; } #'
    target = tar.split()
    grammarCon = getGrammar.getGrammar('/Users/bytedance/My/编译原理/compiler/src/views/LRAnalyseModal/LR/LR_grammar.txt')
    grammar = grammarCon.getContent()
    first = firstAndfollow.First(grammar)
    dfa = DFA_LR1.DFA_LR1(grammar, first.getFirst())
    tab = LR1table.LR1table(grammar)      #LR(1)
    table = tab.construct()
    lr = LRControl.LR(target, table, grammar)
    nodeValue, nodeRelation = lr.startAnalyse()
    # print(tree)
    demo = treeDraw(nodeValue, nodeRelation, grammar, 'lr')
    demo.draw()