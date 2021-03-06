import React, { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { connect } from 'dva';
import { Table, Divider, Popconfirm, Icon, message } from 'antd';
import { APPLICATION_TYPE } from '@/util/businessTypes';
import LocalDateFormat from '@/util/LocalDateFormat';

const Application = (props) => {
  const { list, dispatch } = props;

  const [loading, setLoading] = useState(false);
  const [popLoading, setPopLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectId, setSelectId] = useState(null);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [okVisible, setOkVisible] = useState(false);

  const Columns = [
    {
      title: '组织id',
      dataIndex: 'org_id',
    },
    {
      title: '组织名',
      dataIndex: 'org_name',
    },
    {
      title: '申请用户',
      dataIndex: 'username',
    },
    {
      title: '当前状态',
      dataIndex: 'apply_status',
      render: (text) => {
        const st = APPLICATION_TYPE.find((i) => i.key === text);
        const value = st ? intl.get(st.value) : text;
        return value;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      render: (text) => LocalDateFormat.formatLocalDateTime(new Date(text).getTime()),
    },
    {
      title: '操作',
      render: (_, record) => (
        <>
          <Popconfirm
            title="确认拒绝该用户加入组织？"
            icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}
            onConfirm={() => handleApplication(record.id, 'REJECT')}
            onCancel={() => handlePop(null, false)}
            visible={selectId === record.id && rejectVisible}
            okText="确认"
            cancelText="取消"
          >
            <a className="errorLink" onClick={() => handlePop(record.id, true, 'reject')}>
              拒绝
            </a>
          </Popconfirm>
          <Divider type="vertical" />
          <Popconfirm
            title="确认同意该用户加入组织？"
            icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}
            onConfirm={() => handleApplication(record.id, 'ACCEPT')}
            onCancel={() => handlePop(null, false)}
            visible={selectId === record.id && okVisible}
            okText="确认"
            cancelText="取消"
          >
            <a className="errorLink" onClick={() => handlePop(record.id, true, 'ok')}>
              同意
            </a>
          </Popconfirm>
        </>
      ),
    },
  ];

  useEffect(() => {
    getList();
  }, []);

  const getList = () => {
    setLoading(true);
    dispatch({
      type: 'application/getApplicationList',
    }).finally(() => {
      setLoading(false);
    });
  };

  const handlePop = (id, visible, type) => {
    setSelectId(id);
    if (type === 'ok') {
      setOkVisible(visible);
      setRejectVisible(!visible);
    } else {
      setRejectVisible(visible);
      setOkVisible(!visible);
    }
  };

  const handleApplication = (id, type) => {
    if (popLoading) {
      return;
    }
    setPopLoading(true);
    dispatch({
      type: 'application/replyApplication',
      payload: {
        id,
        apply_status: type,
      },
    })
      .then((data) => {
        message.success('处理成功');
        handlePop(null, false, 'ok');
        getList();
      })
      .catch((err) => {
        message.error(err);
        handlePop(null, false, 'ok');
      })
      .finally(() => {
        setPopLoading(false);
      });
  };

  return (
    <div>
      <Table
        columns={Columns}
        dataSource={list.list}
        onChange={(page) => {
          setCurrent(page.current);
        }}
        pagination={{
          current,
          pageSize,
          showTotal(total) {
            return `共${total}条记录 第${this.current}/${Math.ceil(total / this.pageSize)}页`;
          },
        }}
        loading={loading}
        rowKey="id"
      ></Table>
    </div>
  );
};

export default connect(({ application }) => ({
  list: application.list,
}))(Application);
